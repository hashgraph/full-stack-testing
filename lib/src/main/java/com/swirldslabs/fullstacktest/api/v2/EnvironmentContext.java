package com.swirldslabs.fullstacktest.api.v2;

import org.junit.jupiter.api.extension.ExtensionContext.Store.CloseableResource;

/**
 * This will be the gateway between the tests and the environment
 *
 * pass in a proxy that will later throw arbitrary wrapped exception on any invocation
 * */
public interface EnvironmentContext extends CloseableResource {
}
