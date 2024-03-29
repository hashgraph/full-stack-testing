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

import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

/**
 * Handles the individual test teardown and resource cleanup.
 */
public class TestTeardownExtension implements AfterEachCallback {
    /**
     * Callback that is invoked <em>after</em> an individual test and any user-defined teardown methods for that test
     * have been executed.
     *
     * @param context the current extension context; never {@code null}
     * @throws Exception if an error occurs during callback execution.
     */
    @Override
    public void afterEach(final ExtensionContext context) throws Exception {}
}
