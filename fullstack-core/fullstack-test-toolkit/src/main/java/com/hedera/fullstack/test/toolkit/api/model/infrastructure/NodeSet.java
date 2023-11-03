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

package com.hedera.fullstack.test.toolkit.api.model.infrastructure;

import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * An ordered, indexed set of {@link Node} instances.
 *
 * @implSpec Implementations are required to support both iteration and indexed access.
 */
public interface NodeSet<T extends Node<T>> extends Iterable<T> {

    Optional<T> first();

    Optional<T> last();

    List<T> withTag(String tag);

    T named(String name);

    T indexOf(int index);

    int size();

    boolean isEmpty();

    default Stream<T> stream() {
        return StreamSupport.stream(spliterator(), false);
    }
}
