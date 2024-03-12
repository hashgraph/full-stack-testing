package com.swirldslabs.fullstacktest.api.v4;

import org.junit.jupiter.api.Assumptions;
import org.opentest4j.IncompleteExecutionException;

import java.time.Duration;

import static java.lang.Thread.sleep;
import static java.time.Duration.ZERO;
import static java.time.Duration.ofSeconds;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Probe to be executed before test is started.
 */
public interface PreconditionProbe extends Precondition, Probe {
    /**
     * Initial delay before performing readiness probe.
     * */
    default Duration preConditionInitialDelay() {
        return ZERO;
    }

    /**
     * Number of permitted consecutive failures
     * */
    default long preConditionFailureThreshold() {
        return 5;
    }

    /**
     * Delay following a failed probe
     * */
    default Duration preConditionRetryDelayOnFailure() {
        return ofSeconds(5);
    }

    /**
     * Message to use when reporting failure
     * */
    default String preConditionFailureMessage() {
        return "failed to verify precondition: " + this.getClass().getName();
    }

    @Override
    default void checkPrecondition() throws AssertionError, IncompleteExecutionException, InterruptedException {
        sleep(preConditionInitialDelay());
        for (long failures = 0; !probe(); ++failures) {
            assumeTrue(failures < preConditionFailureThreshold(), preConditionFailureMessage());
            sleep(preConditionRetryDelayOnFailure());
        }
    }
}
