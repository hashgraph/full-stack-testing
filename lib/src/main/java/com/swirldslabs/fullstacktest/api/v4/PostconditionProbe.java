package com.swirldslabs.fullstacktest.api.v4;

import java.time.Duration;

import static java.lang.Thread.sleep;
import static java.time.Duration.ZERO;
import static java.time.Duration.ofSeconds;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Probe to be executed after test completes successfully.
 */
public interface PostconditionProbe extends Postcondition, Probe {
    /**
     * Initial delay before performing readiness probe.
     * */
    default Duration postConditionInitialDelay() {
        return ZERO;
    }

    /**
     * Number of permitted consecutive failures
     * */
    default long postConditionFailureThreshold() {
        return 5;
    }

    /**
     * Delay following a failed probe
     * */
    default Duration postConditionRetryDelayOnFailure() {
        return ofSeconds(5);
    }

    /**
     * Message to use when reporting failure
     * */
    default String postConditionFailureMessage() {
        return "failed to verify postcondition";
    }

    @Override
    default void checkPostcondition() throws AssertionError, InterruptedException {
        sleep(postConditionInitialDelay());
        for (long failures = 0; !probe(); ++failures) {
            assertTrue(failures < postConditionFailureThreshold(), postConditionFailureMessage());
            sleep(postConditionRetryDelayOnFailure());
        }
    }
}
