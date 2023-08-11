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

package com.hedera.fullstack.junit.support.annotations.validation;

import com.hedera.fullstack.junit.support.annotations.flow.SuppressMonitors;
import com.hedera.fullstack.monitoring.api.Monitor;
import java.lang.annotation.*;

/**
 * Declares a list of {@link Monitor} implementations which should be executed during the tests.
 * <p>
 * If this annotation is present on a test class, all tests in the class inherit the list of monitors. If this annotation
 * is also present on one or more test methods, then the list of monitors declared on the method is appended to the list
 * of monitors declared on the class with any duplicates removed. Monitors declared at the class level may be excluded
 * on a per monitor and per test basis by using the {@link SuppressMonitors} at the method level.
 * <p>
 * Default monitors will not be used for a test or class if this annotation is present.
 */
@Inherited
@Documented
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface Monitors {
    /**
     * The list of {@link Monitor} implementations to be executed during the test.
     *
     * @return an array of {@link Monitor} implementations.
     */
    Class<? extends Monitor>[] value();
}
