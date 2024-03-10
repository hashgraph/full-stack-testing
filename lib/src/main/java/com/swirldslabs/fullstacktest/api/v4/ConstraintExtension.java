package com.swirldslabs.fullstacktest.api.v4;

import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.extension.support.TypeBasedParameterResolver;
import org.junit.platform.commons.util.ReflectionUtils;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadFactory;
import java.util.stream.Stream;

import static org.junit.platform.commons.support.AnnotationSupport.findRepeatableAnnotations;

/**
 * Junit5 extension to support constraint based verification, before, during and after test execution.
 * */
public class ConstraintExtension extends TypeBasedParameterResolver<ConstraintContext> implements AfterTestExecutionCallback, BeforeTestExecutionCallback, InvocationInterceptor {
    @Override
    public void afterTestExecution(ExtensionContext extensionContext) throws Exception {

    }

    sealed interface BeforeTestMessage {}
    record UncaughtException(Thread thread, Throwable exception) implements BeforeTestMessage {}
    record Ready(Thread thread) implements BeforeTestMessage {}
    @Override
    public void beforeTestExecution(ExtensionContext extensionContext) throws Exception {
        BlockingQueue<BeforeTestMessage> queue = new LinkedBlockingQueue<>();
        Class<?> testClass = extensionContext.getRequiredTestClass();
        Method testMethod = extensionContext.getRequiredTestMethod();
        ThreadFactory threadFactory = Thread.ofVirtual()
                .name(testClass.getName() + "#" + testMethod.getName())
                .factory();
        List<Class<? extends PreCondition>> preConditions = Stream.concat(
                        findRepeatableAnnotations(testClass, Constraint.class).stream(),
                        findRepeatableAnnotations(testMethod, Constraint.class).stream())
                .flatMap(constraint -> Arrays.stream(constraint.value()))
                .distinct()
                .filter(PreCondition.class::isAssignableFrom)
                .<Class<? extends PreCondition>>map(x -> (Class<? extends PreCondition>) x)
                .toList();
        Map<Thread, Class<? extends PreCondition>> map = new HashMap<>();
        for (Class<? extends PreCondition> preCondition : preConditions) {
            PreCondition instance = ReflectionUtils.newInstance(preCondition);
            Thread thread = threadFactory.newThread(() -> {
                BeforeTestMessage message;
                try {
                    instance.check();
                    message = new Ready(Thread.currentThread());
                } catch (Throwable throwable) {
                    if (throwable instanceof InterruptedException) {
                        Thread.currentThread().interrupt();
                    }
                    message = new UncaughtException(Thread.currentThread(), throwable);
                }
                try {
                    queue.put(message);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            map.put(thread, preCondition);
        }
        map.keySet().forEach(Thread::start);
        while (!map.isEmpty()) {
            switch (queue.take()) {
                case Ready(Thread thread) -> map.remove(thread);
                case UncaughtException(Thread thread, Throwable exception) -> {
                    map.keySet().forEach(Thread::interrupt);
                    try {
                        for (long sleep = 16; sleep <= 512 && !map.isEmpty(); sleep <<= 1) {
                            Thread.sleep(sleep);
                            map.keySet().removeIf(t -> !t.isAlive());
                        }
                    } catch (InterruptedException exception1) {
                        Thread.currentThread().interrupt();
                    }
                    if (!map.isEmpty()) {
                        throw new InterruptIgnoredException(map.values().toString(), exception);
                    }
                    if (exception instanceof Exception) {
                        throw (Exception) exception;
                    }
                    throw new RuntimeException(exception);
                }
            }
        }
    }

    @Override
    public ConstraintContext resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        return null;
    }

    @Override
    public void interceptTestMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        InvocationInterceptor.super.interceptTestMethod(invocation, invocationContext, extensionContext);
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
