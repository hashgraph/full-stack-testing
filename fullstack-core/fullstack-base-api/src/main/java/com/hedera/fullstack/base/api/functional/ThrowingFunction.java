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

package com.hedera.fullstack.base.api.functional;

/**
 * A replacement for {@link java.util.function.Function} which allows for checked exceptions to be thrown.
 *
 * @param <T> the type of the input to the function.
 * @param <R> the type of the result of the function.
 */
@FunctionalInterface
public interface ThrowingFunction<T, R> {
    /**
     * Executes the method potentially throwing a checked exception.
     *
     * @param t the input to the function.
     * @return the result of the function.
     * @throws Throwable if an error occurs.
     */
    @SuppressWarnings("java:S112")
    R apply(T t) throws Throwable;
}
