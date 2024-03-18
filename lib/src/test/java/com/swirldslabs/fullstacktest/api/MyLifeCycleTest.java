package com.swirldslabs.fullstacktest.api;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@Execution(ExecutionMode.CONCURRENT)
public class MyLifeCycleTest {
    @Execution(ExecutionMode.CONCURRENT)
    @BeforeEach
    void beforeEach() {
        System.out.println("beforeEach:" + Thread.currentThread());
    }
    @Execution(ExecutionMode.CONCURRENT)
    @AfterEach
    void afterEach() {
        System.out.println("afterEach:" + Thread.currentThread());
    }
    @Execution(ExecutionMode.CONCURRENT)
    @Test
    void test() {
        System.out.println("test:" + Thread.currentThread());
    }
    @Execution(ExecutionMode.CONCURRENT)
    @RepeatedTest(2)
    void repeatedTest() {
        System.out.println("repeatedTest:" + Thread.currentThread());
    }
    @Execution(ExecutionMode.CONCURRENT)
    @ParameterizedTest
    @ValueSource(ints = {1,2,3})
    void parameterizedTest(int i) {
        System.out.println("parameterizedTest(" + i + "):" + Thread.currentThread());
    }
}
