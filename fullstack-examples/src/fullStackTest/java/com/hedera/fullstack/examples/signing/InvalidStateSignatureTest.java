/*
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.hedera.fullstack.examples.signing;

import com.hedera.fullstack.examples.monitors.InvalidStateSignatureMonitor;
import com.hedera.fullstack.examples.monitors.LogErrorMonitor;
import com.hedera.fullstack.examples.monitors.NodeLivenessMonitor;
import com.hedera.fullstack.examples.readiness.NodeActiveReadinessCheck;
import com.hedera.fullstack.examples.validators.NodeStatisticHealthValidator;
import com.hedera.fullstack.junit.support.annotations.application.ApplicationNodes;
import com.hedera.fullstack.junit.support.annotations.application.PlatformApplication;
import com.hedera.fullstack.junit.support.annotations.application.PlatformConfiguration;
import com.hedera.fullstack.junit.support.annotations.core.ConfigurationValue;
import com.hedera.fullstack.junit.support.annotations.core.FullStackSuite;
import com.hedera.fullstack.junit.support.annotations.core.FullStackTest;
import com.hedera.fullstack.junit.support.annotations.core.TestExecutionMode;
import com.hedera.fullstack.junit.support.annotations.flow.MaxTestExecutionTime;
import com.hedera.fullstack.junit.support.annotations.flow.WaitForDuration;
import com.hedera.fullstack.junit.support.annotations.resource.ResourceShape;
import com.hedera.fullstack.junit.support.annotations.validation.Monitors;
import com.hedera.fullstack.junit.support.annotations.validation.ReadinessChecks;
import com.hedera.fullstack.junit.support.annotations.validation.Validators;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;

@FullStackSuite
@ApplicationNodes(value = 4, shape = @ResourceShape(cpuInMillis = 8_000, memorySize = 8L))
@PlatformApplication(fileName = "ISSTestingTool.jar")
@ReadinessChecks({NodeActiveReadinessCheck.class})
@Monitors(
        value = {NodeLivenessMonitor.class, LogErrorMonitor.class, InvalidStateSignatureMonitor.class},
        config = {
            @ConfigurationValue(
                    name = "log.errors.iss.expected.typeByNodeIndex",
                    values = {"catastrophic", "catastrophic", "catastrophic", "catastrophic"})
        })
@Validators({NodeStatisticHealthValidator.class})
@PlatformConfiguration({
    @ConfigurationValue(name = "state.dumpStateOnAnyISS", value = "false"),
    @ConfigurationValue(name = "state.automatedSelfIssRecovery", value = "true"),
    @ConfigurationValue(name = "state.haltOnCatastrophicIss", value = "true"),
    @ConfigurationValue(name = "event.preconsensus.enableReplay", value = "false"),
    @ConfigurationValue(name = "event.preconsensus.enableStorage", value = "false")
})
@DisplayName("Invalid State Signature Testing Tool")
class InvalidStateSignatureTest {

    @FullStackTest(mode = TestExecutionMode.TIMED_EXECUTION)
    @WaitForDuration(value = 5, unit = TimeUnit.MINUTES)
    @MaxTestExecutionTime(value = 15, unit = TimeUnit.MINUTES)
    @PlatformConfiguration({
        @ConfigurationValue(name = "issTestingTool.plannedISSs", value = "180:0-1-2-3"),
    })
    @DisplayName("ISS-catastrophic-1k-5m")
    void catastrophic_1k_5m() {}
}
