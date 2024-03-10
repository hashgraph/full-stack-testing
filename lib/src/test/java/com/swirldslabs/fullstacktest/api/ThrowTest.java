package com.swirldslabs.fullstacktest.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

public class ThrowTest {
    @Test
    void test() throws Exception {
        try {
            assumeTrue(false);
            assertEquals(1,2);
            throw new IllegalAccessException();
        } catch (Exception exception) {
            throw exception;
        } catch (Throwable throwable) {
            throw new RuntimeException(throwable);
        }
    }
}
