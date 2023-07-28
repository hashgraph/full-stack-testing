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

package com.hedera.fullstack.service.locator.java.sls;

import com.hedera.fullstack.service.locator.api.ServiceSupplier;
import com.hedera.fullstack.service.locator.spi.ServiceLocationProvider;
import com.hedera.fullstack.service.locator.api.WrappedIterator;

import java.util.Iterator;
import java.util.Objects;
import java.util.ServiceLoader;
import java.util.function.Function;

/**
 * A service location provider that uses the {@link java.util.ServiceLoader} to locate services.
 */
public class JavaServiceLoaderProvider implements ServiceLocationProvider {

    private ServiceLoader<?> loader;

    /**
     * Returns an iterator for the given service type.
     *
     * @param serviceClass the class reference forType the service type.
     * @return an iterator for the given service type.
     * @throws NullPointerException if serviceClass is null.
     */
    @Override
    public <S> Iterator<ServiceSupplier<S>> iteratorFor(Class<S> serviceClass) {
        final ServiceLoader<S> loader = resolveLoader(serviceClass);
        return new WrappedIterator<>(loader.stream().iterator(), v -> new ServiceSupplier<>(v.type()));
    }

    /**
     * Clears the cache for the given service type. If the implementation does not support caching, this method may do
     * nothing.
     *
     * @param serviceClass the class reference forType the service type.
     * @throws NullPointerException if serviceClass is null.
     */
    @Override
    public <S> void reload(Class<S> serviceClass) {
        final ServiceLoader<S> loader = resolveLoader(serviceClass);
        loader.reload();
    }

    /**
     * Resolves the service loader for the given service type by either retrieving it from the cache or creating a new
     * instance.
     *
     * @param <S>          the type of the service.
     * @param serviceClass the class reference for the service type.
     * @return the service loader for the given service type.
     * @throws NullPointerException if serviceClass is null.
     */
    @SuppressWarnings("unchecked")
    private synchronized <S> ServiceLoader<S> resolveLoader(Class<S> serviceClass) {
        if (loader != null) {
            return (ServiceLoader<S>) loader;
        }

        Objects.requireNonNull(serviceClass, "serviceClass must not be null");

        final Function<Class<?>, ServiceLoader<?>> computeFn;
        if (serviceClass.getModule() != null && serviceClass.getModule().getLayer() != null) {
            computeFn = clazz -> ServiceLoader.load(this.getClass().getModule().getLayer(), clazz);
        } else {
            computeFn = clazz -> ServiceLoader.load(clazz, getClass().getClassLoader());
        }

        return (ServiceLoader<S>) computeFn.apply(serviceClass);
    }
}
