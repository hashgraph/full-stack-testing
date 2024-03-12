package com.swirldslabs.fullstacktest.api.v4;

import org.opentest4j.IncompleteExecutionException;

/**
 * Probe for constraint verification.
 */
public interface Probe {
    /**
     * Perform probe.
     * This method must return immediately when the thread is interrupted.
     *
     * @return true if and only if requirement has been verified.
     * @throws AssertionError to end the test and mark it as failed.
     * @throws IncompleteExecutionException to end the test and mark it as skipped.
     * @throws InterruptedException when thread is interrupted.
     * @see <a href="https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/Assertions.html">Assertions</a>
     * @see <a href="https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/Assumptions.html">Assumptions</a>
     */
    boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException;
}
