package com.swirldslabs.fullstacktest.api.v3;

import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.extension.support.TypeBasedParameterResolver;

import java.lang.reflect.Method;

public class TestMonitorExtension extends TypeBasedParameterResolver<TestMonitorContext> implements AfterEachCallback, BeforeEachCallback, InvocationInterceptor {
    @Override
    public void afterEach(ExtensionContext extensionContext) throws Exception {

    }

    @Override
    public void beforeEach(ExtensionContext extensionContext) throws Exception {

    }

    @Override
    public TestMonitorContext resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        return new TestMonitorContext();
    }

    @Override
    public void interceptTestMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        invocation.proceed();
    }

    @Override
    public <T> T interceptTestFactoryMethod(Invocation<T> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        invocation.proceed();
    }

    @Override
    public void interceptTestTemplateMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        invocation.proceed();
    }

    @Override
    public void interceptDynamicTest(Invocation<Void> invocation, DynamicTestInvocationContext invocationContext, ExtensionContext extensionContext) throws Throwable {
        invocation.proceed();
    }
}
