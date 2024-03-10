package com.swirldslabs.fullstacktest.api.v4;

import org.opentest4j.IncompleteExecutionException;

/**
 * Probe to be executed after test completes successfully.
 */
public interface PostConditionProbe extends PostCondition, Probe {
    @Override
    default void check() throws AssertionError, IncompleteExecutionException, InterruptedException {
        Probe.super.verify();
    }
}
