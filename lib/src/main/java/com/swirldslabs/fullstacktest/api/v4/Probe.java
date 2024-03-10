package com.swirldslabs.fullstacktest.api.v4;

import org.junit.jupiter.api.Assumptions;
import org.opentest4j.IncompleteExecutionException;

import java.time.Duration;
import java.time.temporal.ChronoUnit;

/**
 * Probe based validator.
 */
public interface Probe extends Validator {
    /**
     * Initial delay before performing readiness probe.
     * */
    default Duration initialDelay() {
        return Duration.ZERO;
    }

    /**
     * Maximum number of retries before reporting failure
     * */
    default long maxRetries() {
        return 5;
    }

    /**
     * Delay between retries
     * */
    default Duration retryDelay() {
        return Duration.of(5, ChronoUnit.SECONDS);
    }

    /**
     * Message to use when reporting failure
     * */
    default String failureMessage() {
        return "invalid";
    }

    /**
     * Perform probe.
     * This method must return immediately when the thread is interrupted.
     *
     * @return true if and only if valid.
     * @throws AssertionError to end the test and mark it as failed.
     * @throws IncompleteExecutionException to end the test and mark it as skipped.
     * @throws InterruptedException when thread is interrupted.
     * @see <a href="https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/Assertions.html">Assertions</a>
     * @see <a href="https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/Assumptions.html">Assumptions</a>
     */
    boolean isValid() throws AssertionError, IncompleteExecutionException, InterruptedException;

    @Override
    default void validate() throws AssertionError, IncompleteExecutionException, InterruptedException {
        Thread.sleep(initialDelay());
        for (long retry = 0; ; ++retry) {
            if (isValid()) {
                return;
            }
            Assumptions.assumeTrue(retry < maxRetries(), failureMessage());
            Thread.sleep(retryDelay());
        }
    }
}
