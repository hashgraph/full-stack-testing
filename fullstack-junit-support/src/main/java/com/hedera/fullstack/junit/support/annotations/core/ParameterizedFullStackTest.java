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

import java.lang.annotation.*;
import org.junit.jupiter.params.ParameterizedTest;

/**
 * One of the two primary annotations used to mark a test method to be executed as a full stack test case. The other
 * annotation is {@link FullStackTest}. All test methods in a class bearing the {@link FullStackSuite}
 * annotation must be annotated with either {@link FullStackTest} or {@link ParameterizedFullStackTest}.
 *
 * @see FullStackSuite
 * @see FullStackTest
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD})
@ParameterizedTest
public @interface ParameterizedFullStackTest {
    /**
     * Please see the documentation for {@link FullStackTest#mode()} for a description of the supported execution flows.
     *
     * @see FullStackTest#mode()
     * @return the execution flow used by this test.
     */
    TestExecutionMode mode() default TestExecutionMode.DEFAULT;
}
