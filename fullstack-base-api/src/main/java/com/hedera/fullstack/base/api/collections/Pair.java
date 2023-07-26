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

package com.hedera.fullstack.base.api.collections;

/**
 * A simple pair of two values.
 *
 * @param <K> the type of the key or left argument of the pair.
 * @param <V> the type of the value or right argument of the pair.
 */
public class Pair<K, V> {

    /**
     * The key or left argument of the pair.
     */
    private final K key;

    /**
     * The value or right argument of the pair.
     */
    private final V value;

    private Pair(final K key, final V value) {
        this.key = key;
        this.value = value;
    }

    public static <K, V> Pair<K, V> of(final K key, final V value) {
        return new Pair<>(key, value);
    }

    /**
     * Retrieves the key or left argument of the pair.
     *
     * @return the key or left argument of the pair.
     */
    public K getKey() {
        return key;
    }

    /**
     * Retrieves the value or right argument of the pair.
     *
     * @return the value or right argument of the pair.
     */
    public V getValue() {
        return value;
    }
}
