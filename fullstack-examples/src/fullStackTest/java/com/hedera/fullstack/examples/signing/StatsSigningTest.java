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
import com.hedera.fullstack.junit.support.annotations.core.FullStackSuite;
import com.hedera.fullstack.junit.support.annotations.core.FullStackTest;
import com.hedera.fullstack.junit.support.annotations.core.TestExecutionMode;
import com.hedera.fullstack.junit.support.annotations.flow.MaxTestExecutionTime;
import com.hedera.fullstack.junit.support.annotations.flow.WaitForDuration;
import com.hedera.fullstack.junit.support.annotations.resource.ResourceShape;
import com.hedera.fullstack.junit.support.annotations.validation.Monitors;
import com.hedera.fullstack.junit.support.annotations.validation.ReadinessChecks;
import com.hedera.fullstack.junit.support.annotations.validation.Validators;
import org.junit.jupiter.api.DisplayName;

@FullStackSuite
@DisplayName("Stats Signing Testing Tool")
class StatsSigningTest {

    /**
     * Replaces the existing {@code Crypto-Basic-10k-4N} test.
     * This test will run the StatsSigningTestingTool.jar at 10k TPS for 20 minutes.
     */
    @FullStackTest(mode = TestExecutionMode.TIMED_EXECUTION)
    @ApplicationNodes(4)
    @ResourceShape(cpuInMillis = 32_000)
    @WaitForDuration(value = 20, unit = java.util.concurrent.TimeUnit.MINUTES)
    @MaxTestExecutionTime(value = 30, unit = java.util.concurrent.TimeUnit.MINUTES)
    @PlatformApplication(
            fileName = "StatsSigningTestingTool.jar",
            parameters = {"1", "3000", "0", "100", "-1", "10000", "5000"})
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
    @DisplayName("Basic 10k TPS - 20 minutes")
    void basic() {}
}
