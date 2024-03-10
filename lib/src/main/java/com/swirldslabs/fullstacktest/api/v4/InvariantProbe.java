package com.swirldslabs.fullstacktest.api.v4;

import org.opentest4j.IncompleteExecutionException;

/**
 * Probe to be executed during test.
 */
public interface InvariantProbe extends Invariant, Probe {
    @Override
    default void validate() throws AssertionError, IncompleteExecutionException, InterruptedException {
        while (!Thread.currentThread().isInterrupted()) {
            Probe.super.validate();
            Thread.sleep(retryDelay());
        }
    }
}
