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

package com.hedera.fullstack.junit.support.annotations.application;

import com.hedera.fullstack.junit.support.annotations.core.ConfigurationValue;

import java.lang.annotation.*;

/**
 * Specifies the configuration values used by the Platform SDK {@code settings.txt} file. This annotation may be applied
 * to a test class or to a test method. If applied to a test class, the configuration values are applied to all test
 * methods in the class. If applied to a test method, the configuration values are applied only to that test method. If
 * applied to both a test class and a test method, the configuration values will be merged with the overlapping values
 * specified by the test method taking precedence. These values are always merged with the default values with
 * the overlapping values supplied by this annotation taking precedence.
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface PlatformConfiguration {
    /**
     * The configuration values to be applied to the Platform SDK {@code settings.txt} file.
     *
     * @return an array of configuration values.
     */
    ConfigurationValue[] value();
}
