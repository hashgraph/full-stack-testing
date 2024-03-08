package com.swirldslabs.fullstacktest.api;

import org.junit.jupiter.api.Test;

public class ThrowTest {
    @Test
    void test() throws Exception {
        try {
            throw new IllegalAccessException();
        } catch (Exception exception) {
            throw exception;
        } catch (Throwable throwable) {
            throw new RuntimeException(throwable);
        }
    }
}
