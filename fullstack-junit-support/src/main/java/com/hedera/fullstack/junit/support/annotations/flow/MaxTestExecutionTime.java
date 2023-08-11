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

import java.lang.annotation.*;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

/**
 * Specifies the maximum time a test is permitted to execute before it is considered to have failed. This time is
 * inclusive of all time spent in the test method and in {@link BeforeAll}, {@link BeforeEach}, {@link AfterEach}, and
 * {@link AfterAll} methods declared by the test suite. For a parameterized test, the timeout applies separately to each
 * invocation of the test method for each unique set of arguments.
 * <p>
 * If this annotation is not present on a test class, then this timeout will individually apply to each test method.
 * Specifying this annotation at the class level will not impose a maximum execution time on the test class as a whole.
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface MaxTestExecutionTime {
    /**
     * The maximum number of time units the test is permitted to execute before it is considered to have failed.
     *
     * @return the maximum number of time units.
     */
    int value();

    /**
     * The time unit of the {@link #value()}. Defaults to {@link TimeUnit#SECONDS}.
     *
     * @return the time unit of the {@link #value()}.
     */
    TimeUnit unit() default TimeUnit.SECONDS;
}
