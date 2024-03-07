package com.swirldslabs.fullstacktest.api;

import org.junit.jupiter.api.extension.ExtensionContext;

import java.util.List;

import static org.junit.platform.commons.support.ReflectionSupport.newInstance;

public class FullStackTestContext implements ExtensionContext.Store.CloseableResource {
    FullStackTest fullStackTest;
    Environment environment;
    List<Monitor> monitors;
    List<Validator> validators;

    FullStackTestContext(FullStackTest fullStackTest) {
        this.fullStackTest = fullStackTest;
        environment = newInstance(fullStackTest.environment());
    }

    @Override
    public void close() throws Throwable {
        environment.close();
    }
}
