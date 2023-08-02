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

package com.hedera.fullstack.service.locator.api;

import com.hedera.fullstack.base.api.reflect.ClassConstructionException;
import java.util.Iterator;
import java.util.Objects;
import java.util.Optional;
import java.util.ServiceLoader;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * The service locator base class provides a set of utility methods which wrap the basic functionality of the Java
 * ServiceLoader implementation.
 *
 * @param <S> the type of the service.
 */
public abstract class ServiceLocator<S> implements Iterable<ServiceSupplier<S>> {
    /**
     * The class reference for the service type.
     */
    private final Class<S> serviceClass;

    /**
     * The JVM service loader instance used to find the service implementations.
     */
    private final ServiceLoader<S> serviceLoader;

    /**
     * Constructs a new ServiceLocator for the given service type.
     *
     * @param serviceClass the class reference of the service type.
     * @throws NullPointerException if serviceClass or serviceLoader is null.
     */
    protected ServiceLocator(final Class<S> serviceClass, final ServiceLoader<S> serviceLoader) {
        this.serviceClass = Objects.requireNonNull(serviceClass, "serviceClass must not be null");
        this.serviceLoader = Objects.requireNonNull(serviceLoader, "graph must not be null");
    }

    /**
     * Loads and returns the first service found. This method requires the service implementations to have a zero
     * argument constructor.
     *
     * @return an optional containing the first service found or an empty optional if no services are found.
     * @throws ClassConstructionException if the service could not be instantiated.
     */
    public Optional<S> findFirst() {
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
    public Optional<ServiceSupplier<S>> findFirstSupplier() {
        final Iterator<ServiceSupplier<S>> it = iterator();
        if (it.hasNext()) {
            return Optional.of(it.next());
        }

        return Optional.empty();
    }

    /**
     * Returns an iterator over elements of type {@code ServiceSupplier<S>}.
     *
     * @return an iterator.
     */
    @Override
    public Iterator<ServiceSupplier<S>> iterator() {
        return new WrappedIterator<>(serviceLoader.stream().iterator(), this::newServiceSupplier);
    }

    /**
     * Returns a stream of all service suppliers found. This method supports service implementations with non-zero
     * argument constructors. The service supplier can be used to instantiate the service implementation with zero or
     * more constructor arguments.
     *
     * @return a stream of all service suppliers found.
     */
    public Stream<ServiceSupplier<S>> stream() {
        return StreamSupport.stream(spliterator(), false);
    }

    /**
     * Returns a parallel stream of all service suppliers found. This method supports service implementations with
     * non-zero argument constructors. The service supplier can be used to instantiate the service implementation with
     * zero or more constructor arguments.
     *
     * @return a parallel stream of all service suppliers found.
     */
    public Stream<ServiceSupplier<S>> parallelStream() {
        return StreamSupport.stream(spliterator(), true);
    }

    /**
     * Clears all internal caches which will cause the service locator to rescan all available services.
     */
    public void reload() {
        serviceLoader.reload();
    }

    /**
     * Converts a service loader provider to a service supplier.
     *
     * @param provider the service loader provider.
     * @return the service supplier.
     */
    private ServiceSupplier<S> newServiceSupplier(final ServiceLoader.Provider<S> provider) {
        return new ServiceSupplier<>(provider.type());
    }
}
