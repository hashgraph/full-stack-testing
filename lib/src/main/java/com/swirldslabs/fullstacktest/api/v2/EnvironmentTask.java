package com.swirldslabs.fullstacktest.api.v2;

/**
 * These are intended to run concurrently with before/test/after methods
 *
 * run before test to "clean"
 * run during test to "monitor" (concurrency is needed only here)
 * run after test to "validate"
 * */
@FunctionalInterface
public interface EnvironmentTask {
    void run(EnvironmentContext environmentContext) throws InterruptedException;
}
