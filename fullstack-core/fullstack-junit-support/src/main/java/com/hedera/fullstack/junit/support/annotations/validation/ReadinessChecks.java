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

import com.hedera.fullstack.junit.support.annotations.core.ConfigurationValue;
import com.hedera.fullstack.junit.support.annotations.flow.SuppressReadinessChecks;
import com.hedera.fullstack.readiness.api.ReadinessCheck;
import java.lang.annotation.*;

/**
 * Declares a list of {@link ReadinessCheck} implementations which should be executed before the test body.
 * <p>
 * If this annotation is present on a test class, all tests in the class inherit the list of readiness checks. If this
 * annotation is also present on one or more test methods, then the list of readiness checks declared on the method is
 * appended to the list of readiness checks declared on the class with any duplicates removed. Readiness checks declared
 * at the class level may be excluded on a per readiness check and per test basis by using the
 * {@link SuppressReadinessChecks} at the method level.
 * <p>
 * Default readiness checks will not be used for a test or class if this annotation is present.
 */
@Inherited
@Documented
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ReadinessChecks {
    /**
     * The list of {@link ReadinessCheck} implementations to be executed during the test.
     *
     * @return an array of {@link ReadinessCheck} implementations.
     */
    Class<? extends ReadinessCheck>[] value();

    /**
     * An array of optional configuration key and value pairs to be passed to the {@link ReadinessCheck} implementations.
     *
     * @return an array of {@link ConfigurationValue} annotations.
     */
    ConfigurationValue[] config() default {};
}
