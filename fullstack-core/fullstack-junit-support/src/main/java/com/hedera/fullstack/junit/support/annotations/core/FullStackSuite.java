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

import com.hedera.fullstack.junit.support.extensions.TestSetupExtension;
import com.hedera.fullstack.junit.support.extensions.TestSuiteConfigurationExtension;
import com.hedera.fullstack.junit.support.extensions.TestSuiteTeardownExtension;
import com.hedera.fullstack.junit.support.extensions.TestTeardownExtension;
import java.lang.annotation.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.parallel.Execution;

/**
 * The primary and mandatory annotation which must be applied to all test classes which are to be executed as part of
 * a full stack test suite. This annotation is a meta-annotation which provides several JUnit Jupiter extensions.
 * These extensions are responsible for setting up and tearing down the test suite, as well as setting up and tearing
 * down each individual test.
 * <p>
 * The test provisioning and concurrency model is dictated by a combination consisting of the JUnit built-in
 * {@link Execution} annotation, the {@code junit.jupiter.execution.parallel.enabled} property, the
 * {@code junit.jupiter.execution.parallel.mode.default} property and the full stack {@link #provisioningModel()} value
 * specified by this annotation.
 * <p>
 * Please refer to the documentation of the {@link ProvisioningModel} enumeration for more information.
 * <p>
 * <b>NOTE: Any unit test bearing this annotation should only contain Full Stack driven unit tests. Combining
 * regular unit tests with Full Stack based unit tests in a single class is not supported.</b>
 *
 * @see ProvisioningModel
 */
@Inherited
@Documented
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith({
    TestSuiteConfigurationExtension.class,
    TestSuiteTeardownExtension.class,
    TestSetupExtension.class,
    TestTeardownExtension.class
})
public @interface FullStackSuite {
    /**
     * The provisioning model to be used for the test suite. The default value is {@link ProvisioningModel#CLEAN_ENV_PER_TEST}.
     * Please see the {@link ProvisioningModel} documentation for more information.
     *
     * @return the provisioning model to be used for the test suite.
     * @see ProvisioningModel
     */
    ProvisioningModel provisioningModel() default ProvisioningModel.CLEAN_ENV_PER_TEST;

    /**
     * The Full Stack test execution framework for the node software. The default value is
     * {@link TestExecutorType#JAVA_DIRECT}.
     *
     * <p>
     * Full Stack tests support two execution frameworks:
     * <ul>
     *     <li>{@link TestExecutorType#JAVA_DIRECT}</li>
     *     <li>{@link TestExecutorType#NODE_MGMT_TOOLS}</li>
     * </ul>
     *
     * <p>
     * The {@link TestExecutorType#JAVA_DIRECT} framework executes the node software using the {@code ubi8-init-java17}
     * docker container image. The {@code ubi8-init-java17} image is built from the {@code ubi8-init} image and
     * includes the Java 17 JDK. Tests using this framework are executed directly in the container using the embedded
     * Java 17 JDK. Node Management Tools are not available when using this framework and are not used for any of the
     * provisioning, configuration, or monitoring operations.
     *
     * <p>
     * The {@link TestExecutorType#NODE_MGMT_TOOLS} framework executes the node software using the {@code ubi8-init-dind}
     * docker container image. The {@code ubi8-init-dind} image is built from the {@code ubi8-init} image and includes
     * the Docker daemon. Tests using this framework are provisioned and executed via the Node Management Tools.
     *
     * @return the execution framework used by this test.
     */
    TestExecutorType executor() default TestExecutorType.JAVA_DIRECT;
}
