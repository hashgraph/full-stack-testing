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

package com.hedera.fullstack.junit.support.annotations.flow;

import com.hedera.fullstack.junit.support.annotations.core.FullStackTest;
import com.hedera.fullstack.junit.support.annotations.core.TestExecutionMode;

import java.lang.annotation.*;
import java.util.concurrent.TimeUnit;

/**
 * Instructs the test framework to wait for a specified duration before executing the test body. This only applies
 * when the {@link FullStackTest#mode()} is {@link TestExecutionMode#TIMED_EXECUTION}. If the
 * {@link FullStackTest#mode()} is set to any other value, then this annotation will be silently ignored.
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface WaitForDuration {
    /**
     * The amount of time units for which to wait before executing the test body.
     *
     * @return the number of time units.
     */
    int value();

    /**
     * The time unit of the {@link #value()}. Defaults to {@link TimeUnit#SECONDS}.
     *
     * @return the time unit of the {@link #value()}.
     * @see TimeUnit
     */
    TimeUnit unit() default TimeUnit.SECONDS;
}
