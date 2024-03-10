package com.swirldslabs.fullstacktest.api;

import org.assertj.core.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.AfterTestExecutionCallback;
import org.junit.jupiter.api.extension.BeforeTestExecutionCallback;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.platform.testkit.engine.EngineExecutionResults;

import static com.swirldslabs.fullstacktest.api.JupiterEngineTest.jupiterExecute;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

public class ExtensionExecutionTest {
    static class MyExtension implements AfterTestExecutionCallback, BeforeTestExecutionCallback {

        @Override
        public void afterTestExecution(ExtensionContext extensionContext) throws Exception {
        }

        @Override
        public void beforeTestExecution(ExtensionContext extensionContext) throws Exception {
        }
    }

    @ExtendWith(MyExtension.class)
    static class MyExampleTest {
        @Test
        void example() {}
    }

    @Test
    void test() {
        EngineExecutionResults results = jupiterExecute(MyExampleTest.class);
        results.allEvents().debug();
    }
}
