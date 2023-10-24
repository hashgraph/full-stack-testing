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

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.parallel.ExecutionMode;

/**
 * The provisioning model determines how the test environment is provisioned. These options are mutually exclusive and
 * may be set on the {@link FullStackSuite} annotation.
 *
 * @see FullStackSuite
 */
public enum ProvisioningModel {
    /**
     * The clean environment per test model will provision a new environment for each test method. This is the default
     * behavior. This model works for all levels of JUnit concurrency and guarantees each test method will be executed
     * in a clean environment with no side effects from other tests.
     */
    CLEAN_ENV_PER_TEST,
    /**
     * The clean environment per class model will provision a new environment for each test class. This model works for
     * the {@link ExecutionMode#SAME_THREAD} concurrency model and guarantees each test class will be executed in a
     * new environment provisioned for the test class and will be cleaned between test method executions. This model
     * attempts to provide, but does not guarantee a side effect free environment for each test method execution.
     */
    CLEAN_ENV_PER_CLASS,
    /**
     * The shared environment per class model will provision a single environment for all test methods in a test class.
     * This model works for all levels of JUnit concurrency. The environment will not be cleaned between test method
     * executions and does not guarantee a side effect free environment for each test method execution. Additionally,
     * the application will not be stopped between test method executions unless a test method or a user supplied
     * {@link AfterEach} method explicitly does so.
     */
    SHARED_PER_CLASS
}
