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

import java.util.Objects;

/**
 * A simple key and value pair. The key must not be {@code null}; however, the value may be {@code null}.
 * The {@link #equals(Object)} and {@link #hashCode()} methods are implemented to compare only the key.
 *
 * @param <K> the type of the key or left argument of the pair. The key must not be {@code null}.
 * @param <V> the type of the value or right argument of the pair.
 */
public record KeyValuePair<K, V>(K key, V value) {
    public KeyValuePair {
        Objects.requireNonNull(key, "key must not be null");
    }

    /**
     * Creates a new {@code KeyValuePair} with the given key and value.
     *
     * @param <K>   the type of the key or left argument of the pair. The key must not be {@code null}.
     * @param <V>   the type of the value or right argument of the pair.
     * @param key   the key. Must not be {@code null}.
     * @param value the value. May be {@code null}.
     * @return a new {@code KeyValuePair} with the given key and value.
     */
    public static <K, V> KeyValuePair<K, V> of(final K key, final V value) {
        return new KeyValuePair<>(key, value);
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (!(o instanceof KeyValuePair<?, ?> that)) return false;
        return Objects.equals(key, that.key);
    }

    @Override
    public int hashCode() {
        return Objects.hash(key);
    }
}
