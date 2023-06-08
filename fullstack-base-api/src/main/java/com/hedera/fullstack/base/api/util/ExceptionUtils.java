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

package com.hedera.fullstack.base.api.util;

import com.hedera.fullstack.base.api.functional.ThrowingRunnable;

/**
 * Standard utility methods for dealing with exceptions.
 */
public class ExceptionUtils {

    /**
     * Private constructor to prevent instantiation of this utility class.
     */
    private ExceptionUtils() {}

    /**
     * Suppresses all exceptions thrown by the given method.
     *
     * @param fn the method for which all exceptions should be suppressed.
     */
    @SuppressWarnings("java:S1181")
    public static void suppressExceptions(final ThrowingRunnable fn) {
        try {
            fn.run();
        } catch (final Error err) {
            throw err;
        } catch (final Throwable ignored) {
            // ignore
        }
    }
}
