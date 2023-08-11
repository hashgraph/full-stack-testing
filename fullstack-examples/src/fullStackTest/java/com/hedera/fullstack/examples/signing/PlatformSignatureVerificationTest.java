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

import com.hedera.fullstack.base.api.units.StorageUnits;
import com.hedera.fullstack.junit.support.annotations.application.ApplicationNodes;
import com.hedera.fullstack.junit.support.annotations.application.LabeledApplicationNode;
import com.hedera.fullstack.junit.support.annotations.application.LabeledApplicationNodes;
import com.hedera.fullstack.junit.support.annotations.core.FullStackSuite;
import com.hedera.fullstack.junit.support.annotations.core.FullStackTest;
import com.hedera.fullstack.junit.support.annotations.core.ParameterizedFullStackTest;
import com.hedera.fullstack.junit.support.annotations.flow.MaxTestExecutionTime;
import com.hedera.fullstack.junit.support.annotations.resource.ResourceShape;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Named;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

@FullStackSuite
public class PlatformSignatureVerificationTest {

    @FullStackTest
    void testBasicCase() {}

    @FullStackTest
    @ApplicationNodes(
            value = 4,
            shape = @ResourceShape(cpuInMillis = 10_000, memorySize = 64, memoryUnits = StorageUnits.GIGABYTES))
    @DisplayName("SSTT: Basic Signatures - Mixed Algorithms - 4 Nodes - 10k TPS")
    void testBasicSignaturesMixedAlgorithms() {}

    @FullStackTest
    @DisplayName("SSTT: Quick Basic Signatures - 2 Nodes - 500 TPS")
    @MaxTestExecutionTime(value = 5, unit = TimeUnit.MINUTES)
    @LabeledApplicationNodes({
        @LabeledApplicationNode("node1"),
        @LabeledApplicationNode(value = "node2", shape = @ResourceShape(cpuInMillis = 2500))
    })
    void testQuickBasicSignatures() {}

    static Stream<Arguments> testScalingBasicSignatures() {
        return Stream.of(Arguments.of(Named.of("5k TPS", 5000)), Arguments.of(Named.of("10k TPS", 10000)));
    }

    @ParameterizedFullStackTest
    @DisplayName("SSTT: Scaling Basic Signatures - 4 Nodes")
    @ApplicationNodes(6)
    @MethodSource
    void testScalingBasicSignatures(int tps) {}
}
