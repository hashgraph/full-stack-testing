package com.swirldslabs.fullstacktest.api.v4;

import org.opentest4j.IncompleteExecutionException;

import java.util.Optional;
import java.util.Random;

/**
 * Probe to be executed during test.
 */
public interface InvariantProbe extends Invariant, Probe {
    @Override
    default void monitor() throws AssertionError, IncompleteExecutionException, InterruptedException {
        Random random = new Random();
        while (!Thread.currentThread().isInterrupted()) {
            Probe.super.verify();
            Thread.sleep(retryDelay(random, 1, Optional.empty()));
        }
    }
}
