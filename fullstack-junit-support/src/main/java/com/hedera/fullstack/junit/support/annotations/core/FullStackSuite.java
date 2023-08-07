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

/**
 * The primary and mandatory annotation which must be applied to all test classes which are to be executed as part of
 * a full stack test suite. This annotation is a meta-annotation which provides several JUnit Jupiter extensions.
 * These extensions are responsible for setting up and tearing down the test suite, as well as setting up and tearing
 * down each individual test.
 * <p>
 *     <b>NOTE: Any unit test bearing this annotation should only contain Full Stack driven unit tests. Combining
 *     regular unit tests with Full Stack based unit tests in a single class is not supported.</b>
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
public @interface FullStackSuite {}
