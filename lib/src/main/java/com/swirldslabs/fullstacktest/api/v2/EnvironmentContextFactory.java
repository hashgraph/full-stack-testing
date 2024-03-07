package com.swirldslabs.fullstacktest.api.v2;

/**
 * Defines the environment, implementations may include for example KubernetesNamespace or KubernetesNamespaceWithSolo
 *
 * Take as input annotation which may include other sources of additional input, URLs, files, executables...
 *
 * implementation produces EnvironmentContext
 *
 * A context will be requested in each thread.
 * */
@FunctionalInterface
public interface EnvironmentContextFactory {
    EnvironmentContext getContext();
}
