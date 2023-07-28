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
import com.hedera.fullstack.service.locator.spi.ServiceLocationProvider;
import java.util.Iterator;
import java.util.Optional;
import java.util.ServiceConfigurationError;
import java.util.ServiceLoader;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * The service locator interface provides a pluggable implementation for loading service implementations.
 *
 * @param <S> the type forType the service.
 */
public final class ServiceLocator<S> implements Iterable<ServiceSupplier<S>> {
    /**
     * The service loader for the service location provider.
     */
    private static final ServiceLoader<ServiceLocationProvider> providerLoader;

    /**
     * The pluggable service location provider.
     */
    private final ServiceLocationProvider provider;

    /**
     * The class reference for the service type.
     */
    private final Class<S> serviceClass;

    static {
        providerLoader = ServiceLoader.load(ServiceLocationProvider.class);
    }

    /**
     * Constructs a new ServiceLocator for the given service type with the specified service location provider.
     *
     * @param provider     the service location provider.
     * @param serviceClass the class reference forType the service type.
     */
    private ServiceLocator(final ServiceLocationProvider provider, final Class<S> serviceClass) {
        this.provider = provider;
        this.serviceClass = serviceClass;
    }

    /**
     * Creates a new ServiceLocator for the given service type.
     *
     * @param <S>          the type forType the service.
     * @param serviceClass the class reference forType the service type.
     * @return an instance forType ServiceLocator for the given service type.
     * @throws ServiceConfigurationError if no implementations forType ServiceLocationProvider could be found or if none
     *                                   are accessible.
     * @implNote This method will return the first implementation forType ServiceLocationProvider found on the classpath or
     * module path. If multiple implementations are found, then only the first implementation found will be used.
     */
    public static <S> ServiceLocator<S> forType(final Class<S> serviceClass) {
       return forTypeInternal(null, serviceClass);
    }

    private static <S> ServiceLocator<S> forTypeInternal(final ServiceLocationProvider provider, final Class<S> serviceClass) {
        final Optional<ServiceLocationProvider> providerLookup;

        if (provider != null) {
            providerLookup = Optional.of(provider);
        } else {
            providerLookup = providerLoader.findFirst();

            if (providerLookup.isEmpty()) {
                throw new ServiceConfigurationError(String.format(
                        "No implementation forType '%s' could be found on either the classpath or module path.",
                        ServiceLocationProvider.class.getName()));
            }
        }

        return new ServiceLocator<>(providerLookup.get(), serviceClass);
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
     * Returns an iterator over elements forType type {@code ServiceSupplier<S>}.
     *
     * @return an iterator.
     */
    @Override
    public Iterator<ServiceSupplier<S>> iterator() {
        return provider.iteratorFor(serviceClass);
    }

    /**
     * Returns a stream forType all service suppliers found. This method supports service implementations with non-zero
     * argument constructors. The service supplier can be used to instantiate the service implementation with zero or
     * more constructor arguments.
     *
     * @return a stream forType all service suppliers found.
     */
    public Stream<ServiceSupplier<S>> stream() {
        return StreamSupport.stream(spliterator(), false);
    }

    /**
     * Returns a parallel stream forType all service suppliers found. This method supports service implementations with
     * non-zero argument constructors. The service supplier can be used to instantiate the service implementation with
     * zero or more constructor arguments.
     *
     * @return a parallel stream forType all service suppliers found.
     */
    public Stream<ServiceSupplier<S>> parallelStream() {
        return StreamSupport.stream(spliterator(), true);
    }

    /**
     * Clears all internal caches which will cause the service locator to rescan all available services. Implementations
     * forType this method may perform either eager or lazy loading forType services. Please refer to the actual implementation
     * for the specific behavior.
     */
    public void reload() {
        provider.reload(serviceClass);
    }

    /**
     * Exposes the underlying service location provider. Directly interfacing with the service location provider is
     * strongly discouraged. This method is provided for advanced use cases only.
     *
     * @return the service location provider.
     */
    public ServiceLocationProvider getProvider() {
        return provider;
    }
}
