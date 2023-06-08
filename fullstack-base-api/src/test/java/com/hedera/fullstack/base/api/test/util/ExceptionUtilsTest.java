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

package com.hedera.fullstack.base.api.test.util;

import static com.hedera.fullstack.base.api.util.ExceptionUtils.suppressExceptions;
import static org.assertj.core.api.Assertions.*;

import java.io.IOError;
import java.io.IOException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ExceptionUtilsTest {

    @Test
    @DisplayName("Verify suppressExceptions works as expected")
    void testSuppressExceptions() {
        assertThatCode(() -> suppressExceptions(() -> {
                    throw new RuntimeException("test exception");
                }))
                .doesNotThrowAnyException();

        // Validate checked exceptions are suppressed
        assertThatCode(() -> suppressExceptions(() -> {
                    throw new Exception("test exception");
                }))
                .doesNotThrowAnyException();

        assertThatCode(() -> suppressExceptions(() -> {
                    throw new IOException("test exception");
                }))
                .doesNotThrowAnyException();

        // Validate errors are not suppressed
        assertThatExceptionOfType(Error.class)
                .isThrownBy(() -> suppressExceptions(() -> {
                    throw new IOError(new Error("test error"));
                }))
                .havingCause()
                .withMessage("test error");
    }
}
