package com.swirldslabs.fullstacktest.api.v4;

import org.junit.platform.commons.logging.Logger;
import org.junit.platform.commons.logging.LoggerFactory;
import org.junit.platform.engine.TestExecutionResult;
import org.junit.platform.engine.reporting.ReportEntry;
import org.junit.platform.launcher.TestIdentifier;
import org.junit.platform.launcher.TestPlan;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;

import java.io.PrintWriter;
import java.lang.invoke.MethodHandles;

import static org.junit.platform.engine.TestExecutionResult.Status.ABORTED;

public class CustomTestExecutionListener extends SummaryGeneratingListener {
    private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
    @Override
    public void reportingEntryPublished(TestIdentifier testIdentifier, ReportEntry entry) {
        super.reportingEntryPublished(testIdentifier, entry);
        System.out.println(entry);
    }

    @Override
    public void executionFinished(TestIdentifier testIdentifier, TestExecutionResult testExecutionResult) {
        super.executionFinished(testIdentifier, testExecutionResult);
        if (ABORTED.equals(testExecutionResult.getStatus()) && testIdentifier.isTest() && testExecutionResult.getThrowable().isPresent()) {
            System.err.println(testExecutionResult.getThrowable().get().getLocalizedMessage());
            testExecutionResult.getThrowable().get().printStackTrace(System.err);
        }
    }

    @Override
    public void testPlanExecutionFinished(TestPlan testPlan) {
        super.testPlanExecutionFinished(testPlan);
        getSummary().printTo(new PrintWriter(System.out));
    }
}
