package com.swirldslabs.fullstacktest.api.v2;

import org.junit.jupiter.api.extension.ExtensionContext.Store.CloseableResource;

import java.util.Collection;

/**
 * Use this to guarantee resources are closed for us by jupiter engine
 */
record CloseableResourceCollection(Collection<CloseableResource> collection) implements CloseableResource {
    @Override
    public void close() throws Throwable {
        for (CloseableResource resource : collection) {
            resource.close();
        }
    }
}
