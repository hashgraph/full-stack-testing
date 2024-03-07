package com.swirldslabs.fullstacktest.api.extension;

import com.swirldslabs.fullstacktest.api.annotation.ExtendWithK8sNamespace;
import com.swirldslabs.fullstacktest.api.environment.KubernetesNamespace;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.ParameterContext;
import org.junit.jupiter.api.extension.ParameterResolutionException;
import org.junit.jupiter.api.extension.ParameterResolver;

@Deprecated
public class K8sNamespaceExtension implements ParameterResolver {
    @Override
    public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        return parameterContext.getParameter().getType().isAssignableFrom(KubernetesNamespace.class);
    }

    @Override
    public KubernetesNamespace resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        KubernetesNamespace kubernetesNamespace = new KubernetesNamespace(parameterContext.getAnnotatedElement().getAnnotation(ExtendWithK8sNamespace.class));
        extensionContext.getStore(ExtensionContext.Namespace.create(extensionContext.getRequiredTestClass(), extensionContext.getRequiredTestMethod())).put(KubernetesNamespace.class, kubernetesNamespace);
        return kubernetesNamespace;
    }
}
