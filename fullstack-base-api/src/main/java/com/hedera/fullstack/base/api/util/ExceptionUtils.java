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
import com.hedera.fullstack.base.api.functional.ThrowingSupplier;

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

    /**
     * Suppresses all exceptions thrown by the given method.
     *
     * @param fn  the method for which all exceptions should be suppressed.
     * @param <T> the type of the result.
     * @return the result of the method or null if an exception was thrown.
     */
    @SuppressWarnings("java:S1181")
    public static <T> T suppressExceptions(final ThrowingSupplier<T> fn) {
        try {
            return fn.get();
        } catch (final Error err) {
            throw err;
        } catch (final Throwable ignored) {
            // ignore
        }

        return null;
    }

    /**
     * Suppresses all exceptions thrown by the given method, returning the given default value if an exception is thrown.
     *
     * @param fn           the method for which all exceptions should be suppressed.
     * @param defaultValue the default value to return if an exception is thrown.
     * @param <T>          the type of the result.
     * @return the result of the method or null if an exception was thrown.
     */
    @SuppressWarnings("java:S1181")
    public static <T> T suppressExceptions(final ThrowingSupplier<T> fn, final T defaultValue) {
        try {
            return fn.get();
        } catch (final Error err) {
            throw err;
        } catch (final Throwable ignored) {
            // ignore
        }

        return defaultValue;
    }
}
