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

import com.hedera.fullstack.junit.support.annotations.flow.WaitForDuration;
import java.lang.annotation.*;
import org.junit.jupiter.api.Test;

/**
 * One of the two primary annotations used to mark a test method to be executed as a full stack test case. The other
 * annotation is {@link ParameterizedFullStackTest}. All test methods in a class bearing the {@link FullStackSuite}
 * annotation must be annotated with either {@link FullStackTest} or {@link ParameterizedFullStackTest}.
 *
 * @see FullStackSuite
 * @see ParameterizedFullStackTest
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD})
@Test
public @interface FullStackTest {
    /**
     * The Full Stack execution mode for the annotated test method. The default value is {@link TestExecutionMode#DEFAULT}.
     *
     * <p>
     * Full Stack tests support three modes of execution:
     * <ul>
     *     <li>{@link TestExecutionMode#DEFAULT}</li>
     *     <li>{@link TestExecutionMode#TIMED_EXECUTION}</li>
     *     <li>{@link TestExecutionMode#PROVISION_ONLY}</li>
     * </ul>
     *
     * <p>
     * The {@link TestExecutionMode#DEFAULT} mode provisions the infrastructure resources, deploys and configures the
     * application, waits for readiness checks to pass, starts the monitors, and finally turns over control to the test
     * method.
     *
     * <p>
     * The {@link TestExecutionMode#TIMED_EXECUTION} mode provisions the infrastructure resources, deploys and
     * configures the application, waits for readiness checks to pass, starts the monitors, and then waits for the time
     * specified by the {@link WaitForDuration} to elapse before turning over control to the test method.
     *
     * <p>
     * The {@link TestExecutionMode#PROVISION_ONLY} mode provisions resources, deploys the application, configures
     * the application, and then passes control to the test method. The provision only mode does not start the node
     * software and does not run any of the readiness checks or monitors. Additionally, validators are not automatically
     * executed when the test method completes or throws an exception.
     * The provision only mode is useful for tests which need explicit control over readiness check, monitor, and
     * validator executions.
     *
     * @return the execution flow used by this test.
     * @see TestExecutionMode
     */
    TestExecutionMode mode() default TestExecutionMode.DEFAULT;

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
