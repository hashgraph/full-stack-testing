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

import com.hedera.fullstack.junit.support.annotations.application.ApplicationNodes;
import com.hedera.fullstack.junit.support.annotations.application.PlatformApplication;
import com.hedera.fullstack.junit.support.annotations.application.PlatformConfiguration;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestInstanceFactoryContext;
import org.junit.jupiter.api.extension.TestInstancePostProcessor;
import org.junit.jupiter.api.extension.TestInstancePreConstructCallback;

import java.util.Arrays;
import java.util.stream.Stream;

/**
 * Initializes the test class instance for the test suite. This initializer is responsible for reading the class level
 * annotations and setting up the suite configuration. Additionally, the individual test annotations will be read and
 * validated. The test suite will not be executed if one or more suite or test level validation failures occur.
 */
public class TestSuiteConfigurationExtension implements TestInstancePreConstructCallback, TestInstancePostProcessor {

    /**
     * Callback that is invoked <em>before</em> the test instance is constructed.
     *
     * @param factoryContext the context for the test instance about to be instantiated; never {@code null}
     * @param context the current extension context; never {@code null}
     * @throws Exception if an error occurs during callback execution.
     */
    @Override
    public void preConstructTestInstance(
            final TestInstanceFactoryContext factoryContext, final ExtensionContext context) throws Exception {
    }

    /**
     * Callback that is invoked <em>after</em> the test instance has been created and configured.
     *
     * @param testInstance the instance to post-process; never {@code null}
     * @param context the current extension context; never {@code null}
     * @throws Exception if an error occurs during post-processing
     */
    @Override
    public void postProcessTestInstance(final Object testInstance, final ExtensionContext context) throws Exception {}
}
