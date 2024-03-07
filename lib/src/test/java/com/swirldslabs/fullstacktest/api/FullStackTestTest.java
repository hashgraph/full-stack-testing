package com.swirldslabs.fullstacktest.api;

import com.swirldslabs.fullstacktest.api.environment.EnvironmentTest;
import org.junit.jupiter.api.*;
import org.junit.platform.commons.logging.Logger;
import org.junit.platform.commons.logging.LoggerFactory;
import org.junit.platform.testkit.engine.EngineExecutionResults;

import static com.swirldslabs.fullstacktest.api.JupiterEngineTest.jupiterExecute;
import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;

public class FullStackTestTest {
    private static final Logger logger = LoggerFactory.getLogger(EnvironmentTest.class);
    @Test
    void test() {
        EngineExecutionResults results = jupiterExecute(BasicFullStackTest.class);
        results.allEvents().debug();
        results.testEvents().assertStatistics(stats -> stats.started(1).succeeded(1));
        results.containerEvents().assertStatistics(stats -> stats.started(2).succeeded(2));
    }

    static class BasicEnvironment implements Environment {
        TestReporter reporter;

        public BasicEnvironment() {
        }

        @Override
        public void close() throws Throwable {
            reporter.publishEntry(getClass() + "::close");
        }
    }
    @FullStackTest(environment = BasicEnvironment.class)
    static class BasicFullStackTest {
        @BeforeAll
        static void beforeAll(TestReporter reporter) {
            reporter.publishEntry("beforeAll called");
        }
        @BeforeEach
        void beforeEach(TestReporter reporter, FullStackTestContext fullStackTestContext) {
            reporter.publishEntry("beforeEach called");
            ((BasicEnvironment) fullStackTestContext.environment).reporter = reporter;
        }

        @Test
        void test(TestReporter reporter) {
            reporter.publishEntry("test called");
        }

        @AfterEach
        void afterEach(TestReporter reporter) {
            reporter.publishEntry("afterEach called");
        }

        @AfterAll
        static void afterAll(TestReporter reporter) {
            reporter.publishEntry("test called");
        }
    }
}
