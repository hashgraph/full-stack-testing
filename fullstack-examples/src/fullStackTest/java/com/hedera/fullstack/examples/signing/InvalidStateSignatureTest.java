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
import com.hedera.fullstack.junit.support.annotations.application.*;
import com.hedera.fullstack.junit.support.annotations.core.ConfigurationValue;
import com.hedera.fullstack.junit.support.annotations.core.FullStackSuite;
import com.hedera.fullstack.junit.support.annotations.core.FullStackTest;
import com.hedera.fullstack.junit.support.annotations.flow.MaxTestExecutionTime;
import com.hedera.fullstack.junit.support.annotations.resource.ResourceShape;
import com.hedera.fullstack.junit.support.annotations.validation.Monitors;
import com.hedera.fullstack.junit.support.annotations.validation.ReadinessChecks;
import com.hedera.fullstack.junit.support.annotations.validation.Validators;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;

@FullStackSuite
@DisplayName("Invalid State Signature Testing Tool")
class InvalidStateSignatureTest {

    @FullStackTest
    @ApplicationNodes(value = 4, shape = @ResourceShape(cpuInMillis = 8_000, memorySize = 8L))
    // TODO: Discuss and define how the max test execution time is calculated
    // TODO: Discuss and define what happens after time is breached (eg: do validators still run, do we download files,
    // etc )
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
    @Monitors({NodeLivenessMonitor.class, LogErrorMonitor.class, InvalidStateSignatureMonitor.class})
    @Validators({NodeStatisticHealthValidator.class})
    @DisplayName("ISS-catastrophic-1k-5m")
    void catastrophic(/* PlatformNodes nodes, MirrorNode mirror */ ) {
        //        for (PlatformNode n : nodes) {
        //            n.stop();
        //            n.configure().platform().settings().addProperty("mysetting", "12234");
        //            // under the hood (uses Infrastructure & Resource Generator)
        //              FileRef settingsFile =
        // pod.file().retrieve("/opt/hgcapp/services-hedera/HapiApp2.0/settings.txt");
        //              byte[] contents = SettingsResource.fromExistingFile(settingsFile).addProperty("mysetting",
        // "12234").render();
        //              pod.file().write("/opt/hgcapp/services-hedera/HapiApp2.0/settings.txt",
        // contents).permissions(0644).owner("hedera").group("hedera");
        //            //
        //
        //            n.start();
        //        }

    }
}
