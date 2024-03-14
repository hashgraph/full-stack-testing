package com.swirldslabs.fullstacktest.api.v4;

import java.util.concurrent.Phaser;

import static java.lang.Thread.sleep;
import static java.time.temporal.ChronoUnit.FOREVER;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class InvariantTest {
    // define multiple invariants declaratively, verify they all run
    // stop and restart declaratively defined invariant, verify it is stopped and restarted
    // do the same for dynamically defined invariant
    // handle case of:
    //   test success/failure/timeout (graceful and forceful)
    //   invariant success/failure/timeout (graceful and forceful)
    // also need to test with lifecycle per class/method
    // also need to test with concurrency same/concurrent at class/method

    static class SuccessInvariant implements Invariant {
        @Override
        public void monitorInvariant() {}
    }
    static class FailureInvariant implements Invariant {
        @Override
        public void monitorInvariant() {
            assertTrue(false);
        }
    }
    static class GracefulTimeoutInvariant implements Invariant {
        @Override
        public void monitorInvariant() throws InterruptedException {
            sleep(FOREVER.getDuration());
        }
    }
    static class ForcefulTimeoutInvariant implements Invariant {
        @Override
        public void monitorInvariant() throws InterruptedException {
            new Phaser(2).arriveAndAwaitAdvance();
        }
    }
}
