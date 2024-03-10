package com.swirldslabs.fullstacktest.api.v4;

import org.opentest4j.IncompleteExecutionException;

/**
 * Interface for all validators.
 * */
public interface Validator {
    /**
     * Perform validation or fail or skip the test by throwing an exception.
     * This method must return immediately when the thread is interrupted.
     *
     * @throws AssertionError to end the test and mark it as failed.
     * @throws IncompleteExecutionException to end the test and mark it as skipped.
     * @throws InterruptedException when thread is interrupted.
     * @see <a href="https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/Assertions.html">Assertions</a>
     * @see <a href="https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/Assumptions.html">Assumptions</a>
     * */
    void validate() throws AssertionError, IncompleteExecutionException, InterruptedException;
}
