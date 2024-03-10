package com.swirldslabs.fullstacktest.api.v4;

import org.junit.jupiter.api.Assumptions;
import org.opentest4j.IncompleteExecutionException;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Random;

/**
 * Probe for constraint verification.
 */
public interface Probe {
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
    default Duration retryDelay(Random random, long attempt, Optional<Duration> previous) {
        // 5 +/- 1 seconds
        return Duration.of(4000 + random.nextInt(2001), ChronoUnit.MILLIS);
    }

    /**
     * Message to use when reporting failure
     * */
    default String failureMessage() {
        return "failed to verify";
    }

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

    /**
     * Use probe to perform constraint verification.
     * */
    default void verify() throws AssertionError, IncompleteExecutionException, InterruptedException {
        Duration previous = null;
        Random random = new Random();
        Thread.sleep(initialDelay());
        long retry = 0;
        while (!probe()) {
            Assumptions.assumeTrue(retry < maxRetries(), failureMessage());
            Thread.sleep(previous = retryDelay(random, ++retry, Optional.ofNullable(previous)));
        }
    }
}
