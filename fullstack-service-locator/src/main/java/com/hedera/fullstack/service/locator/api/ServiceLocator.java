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
import io.github.classgraph.ClassGraph;
import io.github.classgraph.ScanResult;

import java.util.Iterator;
import java.util.Objects;
import java.util.Optional;
import java.util.ServiceLoader;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * The service locator interface provides a pluggable implementation for loading service implementations.
 *
 * @param <S> the type of the service.
 */
public final class ServiceLocator<S> implements Iterable<ServiceSupplier<S>> {
    /**
     * The class reference for the service type.
     */
    private final Class<S> serviceClass;

    /**
     * The class graph used to locate the service implementations.
     */
    private final ClassGraph graph;

    /**
     * An atomic reference to the scan results.
     */
    private final AtomicReference<ScanResult> results;

    /**
     * Constructs a new ServiceLocator for the given service type.
     *
     * @param serviceClass the class reference of the service type.
     */
    private ServiceLocator(final Class<S> serviceClass, final ClassGraph graph) {
        this.serviceClass = Objects.requireNonNull(serviceClass, "serviceClass must not be null");
        this.graph = Objects.requireNonNull(graph, "graph must not be null");
        this.results = new AtomicReference<>();
    }

    /**
     * Creates a service locator for the given service type.
     *
     * @param <S>          the type of the service.
     * @param serviceClass the class reference of the service type.
     * @return a service locator for the given service type.
     * @throws NullPointerException if the serviceClass is null.
     */
    public static <S> ServiceLocator<S> forType(final Class<S> serviceClass) {
        return builderFor(serviceClass).build();
    }

    /**
     * Creates a service locator builder for the given service type.
     *
     * @param <S>          the type of the service.
     * @param serviceClass the class reference of the service type.
     * @return a service locator builder for the given service type.
     */
    public static <S> Builder<S> builderFor(final Class<S> serviceClass) {
        return new Builder<>(serviceClass);
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
        return null;
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
        final ScanResult priorScanResult = results.get();
        if (results.compareAndSet(priorScanResult, null)) {
            if (priorScanResult != null) {
                priorScanResult.close();
            }
            results.get().close();
        }
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

    /**
     * A builder for creating a new ServiceLocator.
     *
     * @param <S> the type of the service.
     */
    public static class Builder<S> {
        /**
         * The class reference for the service type.
         */
        private final Class<S> serviceClass;

        /**
         * The class graph used to locate the service implementations.
         */
        private final ClassGraph graph;

        /**
         * Constructs a new builder for the given service type.
         *
         * @param serviceClass the class reference of the service type.
         */
        private Builder(final Class<S> serviceClass) {
            Objects.requireNonNull(serviceClass, "serviceClass must not be null");
            this.serviceClass = serviceClass;
            this.graph = new ClassGraph().enableClassInfo();
        }

        /**
         * Creates a service locator for the given service type.
         *
         * @return a service locator for the given service type.
         */
        public ServiceLocator<S> build() {
            return new ServiceLocator<>(serviceClass, graph);
        }
    }
}
