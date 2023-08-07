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

package com.hedera.fullstack.junit.support.annotations.core;

/**
 * The test executor type determines how a test is provisioned and executed. These options are mutually exclusive and
 * may be set on the {@link FullStackTest} and {@link ParameterizedFullStackTest} annotations.
 *
 * @see FullStackSuite
 * @see ParameterizedFullStackTest
 */
public enum TestExecutorType {
    /**
     * The Java Direct mode provisions the {@code ubi8-init-java17} base image and runs the test directly on the
     * installed JVM without any Node Management Tool based provisioning. This mode is the default and is meant to be
     * extremely fast and flexible.
     */
    JAVA_DIRECT,

    /**
     * The Node Management Tools mode provisions the {@code ubi8-init-dind} base image and runs the test using the
     * Node Management Tools provisioning mechanism. This mode is meant to be used for tests that require a more
     * realistic environment or depend on network upgrades. This mode is inherently slower and less customizable than
     * the Java Direct mode.
     */
    NODE_MGMT_TOOLS
}
