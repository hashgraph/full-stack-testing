package com.swirldslabs.fullstacktest.api.v4;

import java.time.Duration;

import static java.lang.Thread.currentThread;
import static java.lang.Thread.sleep;
import static java.time.Duration.ZERO;
import static java.time.Duration.ofSeconds;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Probe to be executed during test.
 */
public interface InvariantProbe extends Invariant, Probe {
    /**
     * Initial delay before performing readiness probe.
     * */
    default Duration invariantInitialDelay() {
        return ZERO;
    }

    /**
     * Number of permitted consecutive failures
     * */
    default long invariantFailureThreshold() {
        return 5;
    }

    /**
     * Delay following a failed probe
     * */
    default Duration invariantRetryDelayOnFailure() {
        return ofSeconds(5);
    }

    /**
     * Delay following a successful probe
     * */
    default Duration invariantRetryDelayOnSuccess() {
        return ofSeconds(5);
    }

    /**
     * Message to use when reporting failure
     * */
    default String invariantFailureMessage() {
        return "failed to verify invariant";
    }

    @Override
    default void monitorInvariant() throws AssertionError, InterruptedException {
        sleep(invariantInitialDelay());
        while (!currentThread().isInterrupted()) {
            for (long failures = 0; !probe(); ++failures) {
                assertTrue(failures < invariantFailureThreshold(), invariantFailureMessage());
                sleep(invariantRetryDelayOnFailure());
            }
            sleep(invariantRetryDelayOnSuccess());
        }
    }
}
