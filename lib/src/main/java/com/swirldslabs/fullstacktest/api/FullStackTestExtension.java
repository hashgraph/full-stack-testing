package com.swirldslabs.fullstacktest.api;

import com.swirldslabs.fullstacktest.api.annotation.ExtendWithK8sNamespace;
import com.swirldslabs.fullstacktest.api.environment.KubernetesNamespace;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.ParameterContext;
import org.junit.jupiter.api.extension.ParameterResolutionException;
import org.junit.jupiter.api.extension.ParameterResolver;
import org.junit.platform.commons.support.AnnotationSupport;

import java.lang.reflect.Method;
import java.util.function.Function;

public class FullStackTestExtension implements ParameterResolver {
    @Override
    public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        return parameterContext.getParameter().getType().isAssignableFrom(FullStackTestContext.class);
    }

    @Override
    public Object resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        Class<?> testClass = extensionContext.getRequiredTestClass();
        Method method = extensionContext.getRequiredTestMethod();
        ExtensionContext.Namespace namespace = ExtensionContext.Namespace.create(testClass, method);
        ExtensionContext.Store store = extensionContext.getStore(namespace);
        return store.getOrComputeIfAbsent(FullStackTestContext.class, $ -> {
            FullStackTest fullStackTest = AnnotationSupport.findAnnotation(testClass, FullStackTest.class).orElseThrow();
            return new FullStackTestContext(fullStackTest);
        });
    }
}
