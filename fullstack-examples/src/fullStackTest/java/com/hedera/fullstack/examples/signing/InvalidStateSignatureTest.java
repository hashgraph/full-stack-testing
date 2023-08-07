package com.hedera.fullstack.examples.signing;

import com.hedera.fullstack.examples.monitors.InvalidStateSignatureMonitor;
import com.hedera.fullstack.examples.monitors.LogErrorMonitor;
import com.hedera.fullstack.examples.monitors.NodeLivenessMonitor;
import com.hedera.fullstack.examples.readiness.NodeActiveReadinessCheck;
import com.hedera.fullstack.examples.validators.NodeStatisticHealthValidator;
import com.hedera.fullstack.junit.support.annotation.application.ApplicationNodes;
import com.hedera.fullstack.junit.support.annotation.application.ConfigurationValue;
import com.hedera.fullstack.junit.support.annotation.application.PlatformApplication;
import com.hedera.fullstack.junit.support.annotation.application.PlatformConfiguration;
import com.hedera.fullstack.junit.support.annotation.core.FullStackSuite;
import com.hedera.fullstack.junit.support.annotation.core.FullStackTest;
import com.hedera.fullstack.junit.support.annotation.flow.MaxTestExecutionTime;
import com.hedera.fullstack.junit.support.annotation.resource.ResourceShape;
import com.hedera.fullstack.junit.support.annotation.validation.Monitors;
import com.hedera.fullstack.junit.support.annotation.validation.ReadinessChecks;
import com.hedera.fullstack.junit.support.annotation.validation.Validators;
import org.junit.jupiter.api.DisplayName;

import java.util.concurrent.TimeUnit;

@FullStackSuite
@DisplayName("Invalid State Signature Testing Tool")
class InvalidStateSignatureTest {

    @FullStackTest
    @ApplicationNodes(4)
    @ResourceShape(cpuInMillis = 8_000, memorySize = 8L)
    // TODO: Discuss and define how the max test execution time is calculated
    // TODO: Discuss and define what happens after time is breached (eg: do validators still run, do we download files, etc )
    @MaxTestExecutionTime(value = 10, unit = TimeUnit.MINUTES)
    @PlatformApplication(fileName = "ISSTestingTool.jar")
    @PlatformConfiguration({
            @ConfigurationValue(name = "state.dumpStateOnAnyISS", value = "false"),
            @ConfigurationValue(name = "state.automatedSelfIssRecovery", value = "true"),
            @ConfigurationValue(name = "state.haltOnCatastrophicIss", value = "true"),
            @ConfigurationValue(name = "issTestingTool.plannedISSs", value = "180:0-1-2-3"),
            @ConfigurationValue(name = "event.preconsensus.enableReplay", value = "false"),
            @ConfigurationValue(name = "event.preconsensus.enableStorage", value = "false")
    })
    @ReadinessChecks({
            NodeActiveReadinessCheck.class,
    })
    @Monitors({
            NodeLivenessMonitor.class,
            LogErrorMonitor.class,
            InvalidStateSignatureMonitor.class
    })
    @Validators({
            NodeStatisticHealthValidator.class
    })
    @DisplayName("ISS-catastrophic-1k-5m")
    void catastrophic() {}
}
