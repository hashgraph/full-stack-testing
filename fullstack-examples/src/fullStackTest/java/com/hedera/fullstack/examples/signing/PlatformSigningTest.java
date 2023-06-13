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

import com.hedera.fullstack.junit.support.annotation.core.FullStackSuite;
import com.hedera.fullstack.junit.support.annotation.core.FullStackTest;
import com.hedera.fullstack.junit.support.annotation.core.ParameterizedFullStackTest;
import com.hedera.fullstack.junit.support.annotation.node.ApplicationNodes;
import com.hedera.fullstack.junit.support.annotation.validation.Monitors;
import com.hedera.fullstack.junit.support.annotation.validation.PostTestValidators;
import com.hedera.fullstack.junit.support.annotation.validation.PreTestValidators;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Named;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

@FullStackSuite
@ApplicationNodes(4)
public class PlatformSigningTest {

    public static Stream<Arguments> testScalingBasicSignatures() {
        return Stream.of(Arguments.of(Named.of("5k TPS", 5000)), Arguments.of(Named.of("10k TPS", 10000)));
    }

    @FullStackTest
    @DisplayName("SSTT: Basic Signatures - Mixed Algorithms - 4 Nodes - 10k TPS")
    @Monitors({Monitors.class})
    @PreTestValidators({PreTestValidators.class})
    @PostTestValidators({PostTestValidators.class})
    void testBasicSignaturesMixedAlgorithms() {}

    @ParameterizedFullStackTest
    @DisplayName("SSTT: Scaling Basic Signatures - 4 Nodes")
    @MethodSource
    @Monitors({Monitors.class})
    @PostTestValidators({PostTestValidators.class})
    void testScalingBasicSignatures(int tps) {}
}
