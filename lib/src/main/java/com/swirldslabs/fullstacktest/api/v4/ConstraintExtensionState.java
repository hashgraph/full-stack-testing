package com.swirldslabs.fullstacktest.api.v4;

import com.swirldslabs.fullstacktest.api.v4.SimpleMessageQueue.Message;
import com.swirldslabs.fullstacktest.api.v4.SimpleMessageQueue.Subscription;
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.extension.ExtensionContext.Store.CloseableResource;
import org.junit.jupiter.api.extension.support.TypeBasedParameterResolver;
import org.junit.platform.commons.logging.Logger;
import org.junit.platform.commons.logging.LoggerFactory;
import org.junit.platform.commons.util.ReflectionUtils;

import java.lang.invoke.MethodHandles;
import java.lang.reflect.Method;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.junit.platform.commons.support.AnnotationSupport.findRepeatableAnnotations;

public class ConstraintExtensionState extends TypeBasedParameterResolver<ConstraintContext> implements AfterTestExecutionCallback, BeforeTestExecutionCallback, CloseableResource, InvocationInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
    SimpleMessageQueue msgQueue = new SimpleMessageQueue();
    ThreadFactory threadFactory;

    record TestCase(Class<?> aClass, Method aMethod) {
        public TestCase(ExtensionContext extensionContext) {
            this(extensionContext.getRequiredTestClass(), extensionContext.getRequiredTestMethod());
        }
    }
    ThreadFactory threadFactory(TestCase testCase) {
        if (null == threadFactory) {
            threadFactory = Thread.ofVirtual()
                    .name(testCase.aClass.getName() + "#" + testCase.aMethod.getName())
                    .uncaughtExceptionHandler((t, e) -> {
                        boolean interrupted = Thread.interrupted();
                        if (e instanceof Unexceptional) {
                            msgQueue.publish(new ExitedNormally(null, t));
                        } else if (e instanceof WrappedException) {
                            msgQueue.publish(new ExitedExceptionally(null, t, e.getCause()));
                        } else {
                            msgQueue.publish(new ExitedExceptionally(null, t, e));
                        }
                        if (interrupted) {
                            Thread.currentThread().interrupt();
                        }
                    })
                    .factory();
        }
        return threadFactory;
    }
    TestCase init(ExtensionContext extensionContext) {
        TestCase testCase = new TestCase(extensionContext);
        threadFactory(testCase);
        return testCase;
    }
    <T extends ConstraintVerifier> Stream<Class<T>> constraints(TestCase testCase, Class<T> type) {
        return Stream.concat(
                        findRepeatableAnnotations(testCase.aClass, Constraint.class).stream(),
                        findRepeatableAnnotations(testCase.aMethod, Constraint.class).stream())
                .flatMap(constraint -> Arrays.stream(constraint.value()))
                .distinct()
                .filter(type::isAssignableFrom)
                .map(aClass -> (Class<T>) aClass);
    }

    public interface Executable {
        void execute() throws Throwable;
    }
    public interface ExceptionalConsumer<T> {
        void accept(T value) throws Throwable;
    }
    public interface ExceptionalFunction<T, R> {
        R apply(T t) throws Throwable;
    }
//    <T> Thread newThread(T object, ExceptionalConsumer<T> consumer, ExceptionalFunction<T, Message> function) {
//        return threadFactory.newThread(() -> {
//            try {
//                consumer.accept(object);
//                msgQueue.publish(function.apply(object));
//            } catch (Throwable throwable) {
//                msgQueue.publish(new ExitedExceptionally(Thread.currentThread(), object.getClass(), throwable));
//            }
//        });
//    }
    @Override
    public void afterTestExecution(ExtensionContext extensionContext) throws Exception {}

    sealed interface Response extends Message {}
    record Started<T extends Invariant>(T invariant) implements Response {}
    record Stopped<T extends Invariant>(Object object, T invariant) implements Response {}
    record Error(Object object, String message) implements Response {}

    sealed interface AllTheMessages extends Message {}
    sealed interface Request extends AllTheMessages {}
    record StartRequest(Invariant invariant) implements Request {}
    record StopRequest(Object object) implements Request {} // class<? extends Invariant> or Invariant
    sealed interface ExitStatus extends AllTheMessages {}
    record ExitedExceptionally(Invariant invariant, Thread thread, Throwable throwable) implements ExitStatus {}
    record ExitedNormally(Invariant invariant, Thread thread) implements ExitStatus {}
    record ExitedSuccessfully(Thread thread) implements ExitStatus {}
    @Override
    public void beforeTestExecution(ExtensionContext extensionContext) throws Exception {
        BlockingQueue<ExitStatus> queue = new LinkedBlockingQueue<>();
        Class<?> testClass = extensionContext.getRequiredTestClass();
        Method testMethod = extensionContext.getRequiredTestMethod();
        ThreadFactory threadFactory = Thread.ofVirtual()
                .name(testClass.getName() + "#" + testMethod.getName())
                .factory();
        List<Class<? extends Precondition>> preConditions = Stream.concat(
                        findRepeatableAnnotations(testClass, Constraint.class).stream(),
                        findRepeatableAnnotations(testMethod, Constraint.class).stream())
                .flatMap(constraint -> Arrays.stream(constraint.value()))
                .distinct()
                .filter(Precondition.class::isAssignableFrom)
                .<Class<? extends Precondition>>map(x -> (Class<? extends Precondition>) x)
                .toList();
        Map<Thread, Class<? extends Precondition>> map = new HashMap<>();
        for (Class<? extends Precondition> preCondition : preConditions) {
            Precondition instance = ReflectionUtils.newInstance(preCondition);
            Thread thread = threadFactory.newThread(() -> {
                ExitStatus exitStatus;
                try {
                    instance.checkPrecondition();
                    exitStatus = new ExitedNormally(null, Thread.currentThread());
                } catch (Throwable throwable) {
                    if (throwable instanceof InterruptedException) {
                        Thread.currentThread().interrupt();
                    }
                    exitStatus = new ExitedExceptionally(null, Thread.currentThread(), throwable);
                }
                try {
                    queue.put(exitStatus);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            map.put(thread, preCondition);
        }
        map.keySet().forEach(Thread::start);
        while (!map.isEmpty()) {
            switch (queue.take()) {
                case ExitedSuccessfully(Thread thread) -> {}
                case ExitedNormally(Object object, Thread thread) -> map.remove(thread);
                case ExitedExceptionally(Object object, Thread thread, Throwable exception) -> {
                    map.keySet().forEach(Thread::interrupt);
                    try {
                        for (long sleep = 16; sleep <= 256 && !map.isEmpty(); sleep <<= 1) {
                            Thread.sleep(sleep);
                            map.keySet().removeIf(t -> !t.isAlive());
                        }
                    } catch (InterruptedException exception1) {
                        Thread.currentThread().interrupt();
                    }
                    if (!map.isEmpty()) {
                        TimeoutException timeoutException = new TimeoutException("waiting for threads to shutdown: " + map.values());
                        timeoutException.initCause(exception);
                        throw timeoutException;
                    }
                    if (exception instanceof Exception) {
                        throw (Exception) exception;
                    }
                    throw new RuntimeException(exception);
                }
            }
        }
    }

    void join() throws InterruptedException {
        for (Thread thread : threads) {
            thread.join();
        }
    }
    @Override
    public void close() throws Throwable {
        // todo: map threads to objects
        assertTimeoutPreemptively(Duration.ofSeconds(1), this::join, "waiting for threads to shutdown: "  + threads.stream().filter(Thread::isAlive).toList());
    }

    @Override
    public ConstraintContext resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        return new ConstraintContext(msgQueue);
    }

    record ClassAndInstance(Class<? extends Invariant> aClass, Invariant invariant) {}
    Set<Thread> threads = new HashSet<>();
    static class Unexceptional extends RuntimeException {}
    static class WrappedException extends RuntimeException {
        public WrappedException(Throwable cause) {
            super(cause);
        }
    }
    @Override
    public void interceptTestMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        TestCase testCase = init(extensionContext);
        try (Subscription<AllTheMessages> subscription = msgQueue.subscribe(AllTheMessages.class)) {
            Map<Invariant, Thread> map = constraints(testCase, Invariant.class)
                    .map($ -> new ClassAndInstance($, ReflectionUtils.newInstance($)))
                    .collect(Collectors.toMap(ClassAndInstance::invariant, obj -> threadFactory.newThread(() -> {
                        try {
                            obj.invariant.monitorInvariant();
                            throw new Unexceptional();
                        } catch (InterruptedException exception) {
                            Thread.currentThread().interrupt();
//                            throw new WrappedException(exception);
                        }
                    }), (a, b) -> a, /*WeakHashMap*/HashMap::new));
//            logger.info(() -> "created threads: " + map.values());
            // fixme: I think the problem may be a race condition due to receiving the exited-normally event
            //        and possibly even the stop-request while the thread is still alive.
            //        I think I can mitigate this with a default-uncaught-exception-handler
            Map<Class<? extends Invariant>, ? extends Invariant> map2 = map.entrySet().stream().collect(Collectors.toMap($ -> $.getKey().getClass(), $ -> $.getKey(),
                    (a, b) -> a, /*WeakHashMap*/HashMap::new));
            // maybe: run invocation.proceed() in same thread
            // run switch(msqQueue) in seperate thread, or even seperate threads (exit & request handlers)
            map.put(null, threadFactory.newThread(() -> {
                try {
                    invocation.proceed();
                    msgQueue.publish(new ExitedSuccessfully(Thread.currentThread()));
                } catch (Throwable throwable) {
                    throw new WrappedException(throwable);
                }
            }));
            threads.addAll(map.values());
            map.values().stream().distinct().forEach(Thread::start);
            Map<Thread, Object> pendingStop = new IdentityHashMap<>();//new HashMap<>();
            while (!Thread.currentThread().isInterrupted()) {
//                logger.info(() -> "waiting to rx next msg");
//                for (; null == subscription.queue.peek(); Thread.sleep(1));
//                logger.info(() -> "next msg rx: " + subscription.queue.peek());
                switch (subscription.queue.take()) {
                    case StartRequest(Invariant invariant) -> {
                        Thread thread = threadFactory.newThread(() -> {
                            try {
                                invariant.monitorInvariant();
                                throw new Unexceptional();
                            } catch (InterruptedException exception) {
                                Thread.currentThread().interrupt();
//                                throw new WrappedException(exception);
                            }
                        });
                        thread.start();
//                        logger.info(() -> "started thread: " + thread);
                        msgQueue.publish(new Started(invariant));
                        map.put(invariant, thread);
                    }
                    case StopRequest(Object object) -> {
                        Invariant invariant = object instanceof Class<?> ? map2.get(object) : (Invariant) object;
                        Thread thread = map.get(invariant);
                        if (null == thread) {
                            msgQueue.publish(new Error(object, "not found: " + object));
                        } else if (thread.isAlive()) {
                            thread.interrupt();
                            pendingStop.put(thread, object);
                            logger.info(() -> "pendingStop: " + thread + ", " + object + ", " + invariant);
                            if (null == invariant) {
                                logger.info(() -> "invariant is null, map: " + map);
                                logger.info(() -> "invariant is null, map2: " + map2);
                            }
//                            map.remove(object);
                        } else {
                            msgQueue.publish(new Stopped(object, invariant));
                        }
                    }
                    case ExitedExceptionally(Invariant invariant, Thread thread, Throwable throwable) -> {
                        thread.join();
//                        logger.info(() -> "ExitedExceptionally thread.isAlive: " + thread.isAlive() + ", " + thread);
                        if (pendingStop.containsKey(thread) && throwable instanceof InterruptedException) {
                            Object object = pendingStop.remove(thread);
                            threads.remove(thread);
                            invariant = map.entrySet().stream().filter(e -> e.getValue().equals(thread)).findAny().get().getKey();
                            msgQueue.publish(new Stopped(object, invariant));
                        } else {
                            threads.forEach(Thread::interrupt);
                            throw throwable; // handle cleanup inside close
                        }
                    }
                    case ExitedNormally(Invariant invariant, Thread thread) -> {
//                        logger.info(() -> "ExitedNormally joining thread: " + thread);
                        thread.join();
//                        logger.info(() -> "ExitedNormally thread.isAlive: " + thread.isAlive() + ", " + thread);
                        if (pendingStop.containsKey(thread)) {
//                            logger.info(() -> "publishing stop event");
                            Object object = pendingStop.remove(thread);
                            invariant = map.entrySet().stream().filter(e -> e.getValue().equals(thread)).findAny().get().getKey();
                            msgQueue.publish(new Stopped(object, invariant));
                        } else {
//                            logger.info(() -> "thread not found: " + thread + ", in " + pendingStop);
                        }
                        threads.remove(thread);
                    }
                    case ExitedSuccessfully(Thread thread) -> {
                        threads.forEach(Thread::interrupt);
                        return;
                    }
                }
            }
        } catch (Throwable throwable) {
//            logger.info(() -> "caught: " + throwable);
            throw throwable;
        } finally {
//            logger.info(() -> "exiting for intercept test method");
        }
    }

    @Override
    public <T> T interceptTestFactoryMethod(Invocation<T> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        return InvocationInterceptor.super.interceptTestFactoryMethod(invocation, invocationContext, extensionContext);
    }

    @Override
    public void interceptTestTemplateMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
//        InvocationInterceptor.super.interceptTestTemplateMethod(invocation, invocationContext, extensionContext);
        interceptTestMethod(invocation, invocationContext, extensionContext);
    }

    @Override
    public void interceptDynamicTest(Invocation<Void> invocation, DynamicTestInvocationContext invocationContext, ExtensionContext extensionContext) throws Throwable {
        InvocationInterceptor.super.interceptDynamicTest(invocation, invocationContext, extensionContext);
//        interceptTestMethod(invocation, null, extensionContext);
    }
}
