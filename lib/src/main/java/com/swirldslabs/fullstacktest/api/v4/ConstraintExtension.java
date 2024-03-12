package com.swirldslabs.fullstacktest.api.v4;

import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.extension.support.TypeBasedParameterResolver;
import org.junit.platform.commons.util.ReflectionUtils;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.extension.ExtensionContext.Namespace.create;

/**
 * Junit5 extension to support constraint based verification, before, during and after test execution.
 * */
public class ConstraintExtension extends TypeBasedParameterResolver<ConstraintContext> implements AfterTestExecutionCallback, BeforeTestExecutionCallback, InvocationInterceptor {
    ConstraintExtensionState state(ExtensionContext ctx) {
        return ctx.getStore(create(ctx.getRequiredTestClass(), ctx.getRequiredTestMethod()))
                .getOrComputeIfAbsent(ConstraintExtensionState.class, ReflectionUtils::newInstance, ConstraintExtensionState.class);
    }
    @Override
    public void afterTestExecution(ExtensionContext extensionContext) throws Exception {
        state(extensionContext).afterTestExecution(extensionContext);
    }

    @Override
    public void beforeTestExecution(ExtensionContext extensionContext) throws Exception {
        state(extensionContext).beforeTestExecution(extensionContext);
    }

    @Override
    public ConstraintContext resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        return state(extensionContext).resolveParameter(parameterContext, extensionContext);
    }

    @Override
    public void interceptTestMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        state(extensionContext).interceptTestMethod(invocation, invocationContext, extensionContext);
    }

    @Override
    public <T> T interceptTestFactoryMethod(Invocation<T> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        return state(extensionContext).interceptTestFactoryMethod(invocation, invocationContext, extensionContext);
    }

    @Override
    public void interceptTestTemplateMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        state(extensionContext).interceptTestTemplateMethod(invocation, invocationContext, extensionContext);
    }

    @Override
    public void interceptDynamicTest(Invocation<Void> invocation, DynamicTestInvocationContext invocationContext, ExtensionContext extensionContext) throws Throwable {
        state(extensionContext).interceptDynamicTest(invocation, invocationContext, extensionContext);
    }
}
