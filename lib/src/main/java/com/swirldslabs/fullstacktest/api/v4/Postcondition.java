package com.swirldslabs.fullstacktest.api.v4;

/**
 * Postcondition checker for test case.
 * */
public non-sealed interface Postcondition extends ConstraintVerifier {
    /**
     * Check postcondition or fail or skip the test by throwing an exception.
     * This method must return immediately when the thread is interrupted.
     *
     * @throws AssertionError to end the test and mark it as failed.
     * @throws InterruptedException when thread is interrupted.
     * @see <a href="https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/Assertions.html">Assertions</a>
     * */
    void checkPostcondition() throws AssertionError, InterruptedException;
}
