package com.swirldslabs.fullstacktest.api.v4;

import org.junit.jupiter.api.TestFactory;
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.extension.support.TypeBasedParameterResolver;
import org.junit.platform.commons.util.AnnotationUtils;
import org.junit.platform.commons.util.ReflectionUtils;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.extension.ExtensionContext.Namespace.create;

/**
 * Junit5 extension to support constraint based verification, before, during and after test execution.
 * */
public class ConstraintExtension extends TypeBasedParameterResolver<ConstraintContext> implements AfterTestExecutionCallback, BeforeTestExecutionCallback, InvocationInterceptor {
    ConstraintExtensionState state(ExtensionContext ctx) {
        System.out.println("execution mode: " + ctx.getExecutionMode());
        System.out.println("test factory: " + AnnotationUtils.findAnnotation(ctx.getRequiredTestMethod(), TestFactory.class).isPresent());
        System.out.println("test instance lifecycle: " + ctx.getTestInstanceLifecycle());
        return ctx.getStore(create(ctx.getRequiredTestClass(), ctx.getRequiredTestMethod()))
                .getOrComputeIfAbsent(ConstraintExtensionState.class, ReflectionUtils::newInstance, ConstraintExtensionState.class);
    }
    @Override
    public void afterTestExecution(ExtensionContext extensionContext) throws Exception {
//        System.out.println("afterTestExecution");
        ConstraintExtensionState state = state(extensionContext);
        state.afterTestExecution(extensionContext);
        try {
            state.close();
        } catch (Throwable e) {
            throw new RuntimeException(e);
        }
        extensionContext.getStore(create(extensionContext.getRequiredTestClass(), extensionContext.getRequiredTestMethod()))
                .remove(ConstraintExtensionState.class);
    }

    @Override
    public void beforeTestExecution(ExtensionContext extensionContext) throws Exception {
//        System.out.println("beforeTestExecution");
        state(extensionContext).beforeTestExecution(extensionContext);
    }

    @Override
    public ConstraintContext resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        System.out.println("resolveParameter");
        return state(extensionContext).resolveParameter(parameterContext, extensionContext);
    }

    @Override
    public void interceptTestMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
//        System.out.println("interceptTestMethod: " + Thread.currentThread());
        state(extensionContext).interceptTestMethod(invocation, invocationContext, extensionContext);
    }

    @Override
    public <T> T interceptTestFactoryMethod(Invocation<T> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
//        System.out.println("interceptTestFactoryMethod");
        return state(extensionContext).interceptTestFactoryMethod(invocation, invocationContext, extensionContext);
    }

    @Override
    public void interceptTestTemplateMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
        System.out.println("interceptTestTemplateMethod: " + Thread.currentThread());
        state(extensionContext).interceptTestTemplateMethod(invocation, invocationContext, extensionContext);
    }

/*
    @Override
    public void interceptDynamicTest(Invocation<Void> invocation, DynamicTestInvocationContext invocationContext, ExtensionContext extensionContext) throws Throwable {
        System.out.println("interceptDynamicTest: " + Thread.currentThread());
        ExtensionContext ctx = extensionContext.getParent().get();
        state(ctx).interceptDynamicTest(invocation, invocationContext, ctx);
    }
*/
}
