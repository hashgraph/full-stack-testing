package com.swirldslabs.fullstacktest.api.v4;

import org.opentest4j.IncompleteExecutionException;

/**
 * Probe to be executed before test is started.
 */
public interface PreConditionProbe extends PreCondition, Probe {
    @Override
    default void check() throws AssertionError, IncompleteExecutionException, InterruptedException {
        Probe.super.verify();
    }
}
