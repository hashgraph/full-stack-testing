package com.swirldslabs.fullstacktest.api.v4;

import com.swirldslabs.fullstacktest.api.v4.SimpleMessageQueue.Message;
import com.swirldslabs.fullstacktest.api.v4.SimpleMessageQueue.Subscription;
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.extension.ExtensionContext.Store.CloseableResource;
import org.junit.jupiter.api.extension.support.TypeBasedParameterResolver;
import org.junit.platform.commons.util.ReflectionUtils;

import java.lang.reflect.Method;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.junit.platform.commons.support.AnnotationSupport.findRepeatableAnnotations;

public class ConstraintExtensionState extends TypeBasedParameterResolver<ConstraintContext> implements AfterTestExecutionCallback, BeforeTestExecutionCallback, CloseableResource, InvocationInterceptor {
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
    public void afterTestExecution(ExtensionContext extensionContext) throws Exception {

    }

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
    @Override
    public void interceptTestMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        TestCase testCase = init(extensionContext);
        try (Subscription<AllTheMessages> subscription = msgQueue.subscribe(AllTheMessages.class)) {
            Map<Object, Thread> map = constraints(testCase, Invariant.class)
                    .map($ -> new ClassAndInstance($, ReflectionUtils.newInstance($)))
                    .collect(Collectors.toMap(ClassAndInstance::aClass, obj -> threadFactory.newThread(() -> {
                        try {
                            obj.invariant.monitorInvariant();
                            msgQueue.publish(new ExitedNormally(obj.invariant, Thread.currentThread()));
                        } catch (Throwable throwable) {
                            msgQueue.publish(new ExitedExceptionally(obj.invariant, Thread.currentThread(), throwable));
                        }
                    })));
            // maybe: run invocation.proceed() in same thread
            // run switch(msqQueue) in seperate thread, or even seperate threads (exit & request handlers)
            map.put(null, threadFactory.newThread(() -> {
                try {
                    invocation.proceed();
                    msgQueue.publish(new ExitedSuccessfully(Thread.currentThread()));
                } catch (Throwable throwable) {
                    msgQueue.publish(new ExitedExceptionally(null, Thread.currentThread(), throwable));
                }
            }));
            threads.addAll(map.values());
            map.values().forEach(Thread::start);
            Map<Thread, Object> pendingStop = new HashMap<>();
            while (!Thread.currentThread().isInterrupted()) {
                switch (subscription.queue.take()) {
                    case StartRequest(Invariant invariant) -> {
                        Thread thread = threadFactory.newThread(() -> {
                            try {
                                invariant.monitorInvariant();
                                msgQueue.publish(new ExitedNormally(invariant, Thread.currentThread()));
                            } catch (Throwable throwable) {
                                msgQueue.publish(new ExitedExceptionally(invariant, Thread.currentThread(), throwable));
                            }
                        });
                        thread.start();
                        msgQueue.publish(new Started(invariant));
                        map.put(invariant, thread);
                    }
                    case StopRequest(Object object) -> {
                        Thread thread = map.get(object);
                        if (null == thread) {
                            msgQueue.publish(new Error(object, "not found: " + object));
                        } else {
                            thread.interrupt();
                            pendingStop.put(thread, object);
                            map.remove(object);
                        }
                    }
                    case ExitedExceptionally(Invariant invariant, Thread thread, Throwable throwable) -> {
                        if (pendingStop.containsKey(thread) && throwable instanceof InterruptedException) {
                            Object object = pendingStop.remove(thread);
                            threads.remove(thread);
                            msgQueue.publish(new Stopped(object, invariant));
                        } else {
                            threads.forEach(Thread::interrupt);
                            throw throwable; // handle cleanup inside close
                        }
                    }
                    case ExitedNormally(Invariant invariant, Thread thread) -> {
                        if (pendingStop.containsKey(thread)) {
                            Object object = pendingStop.remove(thread);
                            msgQueue.publish(new Stopped(object, invariant));
                        }
                        threads.remove(thread);
                    }
                    case ExitedSuccessfully(Thread thread) -> {
                        threads.forEach(Thread::interrupt);
                        return;
                    }
                }
            }
        }
    }

    @Override
    public <T> T interceptTestFactoryMethod(Invocation<T> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        return InvocationInterceptor.super.interceptTestFactoryMethod(invocation, invocationContext, extensionContext);
    }

    @Override
    public void interceptTestTemplateMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        InvocationInterceptor.super.interceptTestTemplateMethod(invocation, invocationContext, extensionContext);
    }

    @Override
    public void interceptDynamicTest(Invocation<Void> invocation, DynamicTestInvocationContext invocationContext, ExtensionContext extensionContext) throws Throwable {
        InvocationInterceptor.super.interceptDynamicTest(invocation, invocationContext, extensionContext);
    }
}
