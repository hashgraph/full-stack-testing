package com.swirldslabs.fullstacktest.api.extension;

import com.swirldslabs.fullstacktest.api.annotation.ExtendWithK8sNamespace;
import com.swirldslabs.fullstacktest.api.environment.K8sNamespace;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.ParameterContext;
import org.junit.jupiter.api.extension.ParameterResolutionException;
import org.junit.jupiter.api.extension.ParameterResolver;

public class K8sNamespaceExtension implements ParameterResolver {
    @Override
    public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        return parameterContext.getParameter().getType().isAssignableFrom(K8sNamespace.class);
    }

    @Override
    public K8sNamespace resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        K8sNamespace k8sNamespace = new K8sNamespace(parameterContext.getAnnotatedElement().getAnnotation(ExtendWithK8sNamespace.class));
        extensionContext.getStore(ExtensionContext.Namespace.create(extensionContext.getRequiredTestClass(), extensionContext.getRequiredTestMethod())).put(K8sNamespace.class, k8sNamespace);
        return k8sNamespace;
    }
}
