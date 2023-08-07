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

package com.hedera.fullstack.junit.support.extensions;

import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestInstancePreDestroyCallback;

/**
 * Handles the test suite teardown and resource cleanup.
 */
public class TestSuiteTeardownExtension implements TestInstancePreDestroyCallback {
    /**
     * Callback for processing test instances before they are destroyed.
     *
     * @param context the current extension context; never {@code null}
     * @throws Exception if an error occurs during callback execution.
     * @see ExtensionContext#getTestInstance()
     * @see ExtensionContext#getRequiredTestInstance()
     * @see ExtensionContext#getTestInstances()
     * @see ExtensionContext#getRequiredTestInstances()
     */
    @Override
    public void preDestroyTestInstance(ExtensionContext context) throws Exception {}
}
