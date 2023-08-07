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

public enum TestExecutionMode {
    /**
     * The default behavior is to provision resources, start the application, wait for any readiness checks, and
     * start any monitors before the test method is executed.
     */
    DEFAULT,

    /**
     * Timed execution mode will provision resources, start the application, wait for any readiness checks, start any
     * monitors, and then wait for the {@link com.hedera.fullstack.junit.support.annotations.flow.WaitForDuration}
     * to expire before executing the test method.
     */
    TIMED_EXECUTION,

    /**
     * Provision only mode will stage the resources, but not start the application, monitors, or wait for readiness.
     * The test method will be executed immediately after the basic resources are provisioned.
     */
    PROVISION_ONLY,
}
