package com.hedera.fullstack.service.locator.test.mock;

import com.hedera.fullstack.service.locator.api.ServiceLocator;

import java.util.ServiceLoader;

public class MockLocator extends ServiceLocator<CtorService> {
    private MockLocator(final Class<CtorService> serviceClass, final ServiceLoader<CtorService> serviceLoader) {
        super(serviceClass, serviceLoader);
    }

    public static ServiceLocator<CtorService> create() {
        return new MockLocator(CtorService.class, ServiceLoader.load(CtorService.class));
    }
}
