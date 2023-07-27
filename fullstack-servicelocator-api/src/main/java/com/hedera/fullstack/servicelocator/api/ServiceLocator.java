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

package com.hedera.fullstack.servicelocator.api;

import com.hedera.fullstack.base.api.reflect.ClassConstructionException;
import java.util.Iterator;
import java.util.Optional;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * The service locator interface provides a pluggable implementation for loading service implementations.
 *
 * @param <S> the type of the service.
 */
public interface ServiceLocator<S> extends Iterable<ServiceSupplier<S>> {
    /**
     * Loads and returns the first service found. This method requires the service implementations to have a zero
     * argument constructor.
     *
     * @return an optional containing the first service found or an empty optional if no services are found.
     * @throws ClassConstructionException if the service could not be instantiated.
     */
    default Optional<S> findFirst() {
        final ServiceSupplier<S> supplier = findFirstSupplier().orElse(null);
        return (supplier != null) ? Optional.of(supplier.newServiceInstance()) : Optional.empty();
    }

    /**
     * Loads and returns the first service supplier found. This method supports service implementations with non-zero
     * argument constructors. The service supplier can be used to instantiate the service implementation with zero or
     * more constructor arguments.
     *
     * @return an optional containing the first service supplier found or an empty optional if no services are found.
     */
    default Optional<ServiceSupplier<S>> findFirstSupplier() {
        final Iterator<ServiceSupplier<S>> it = iterator();
        if (it.hasNext()) {
            return Optional.of(it.next());
        }

        return Optional.empty();
    }

    /**
     * Returns a stream of all service suppliers found. This method supports service implementations with non-zero
     * argument constructors. The service supplier can be used to instantiate the service implementation with zero or
     * more constructor arguments.
     *
     * @return a stream of all service suppliers found.
     */
    default Stream<ServiceSupplier<S>> stream() {
        return StreamSupport.stream(spliterator(), false);
    }

    /**
     * Returns a parallel stream of all service suppliers found. This method supports service implementations with
     * non-zero argument constructors. The service supplier can be used to instantiate the service implementation with
     * zero or more constructor arguments.
     *
     * @return a parallel stream of all service suppliers found.
     */
    default Stream<ServiceSupplier<S>> parallelStream() {
        return StreamSupport.stream(spliterator(), true);
    }

    /**
     * Clears all internal caches which will cause the service locator to rescan all available services. Implementations
     * of this method may perform either eager or lazy loading of services. Please refer to the actual implementation
     * for the specific behavior.
     */
    void reload();
}
