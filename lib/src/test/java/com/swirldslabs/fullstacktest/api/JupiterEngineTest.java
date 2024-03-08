package com.swirldslabs.fullstacktest.api;

import org.junit.platform.testkit.engine.EngineExecutionResults;
import org.junit.platform.testkit.engine.EngineTestKit;

import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;

public class JupiterEngineTest {
    public static EngineExecutionResults jupiterExecute(Class<?> aClass) {
        return EngineTestKit
                .engine("junit-jupiter")
                .selectors(selectClass(aClass))
                .execute();
    }
}
