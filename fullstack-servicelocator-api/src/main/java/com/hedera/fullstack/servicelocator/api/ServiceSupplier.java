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
import com.hedera.fullstack.base.api.reflect.Construction;
import java.util.Objects;

/**
 * Base class for implementations of the service supplier pattern. The service supplier pattern is designed to decouple
 * the service detection logic from the instantiation of the actual service. This allows for the service detection logic
 * to be implemented with a zero argument constructor in compliance with the Java ServiceLoader specification while
 * allowing actual service instances to be instantiated with a constructor that takes zero or more arguments.
 *
 * @param <T> the type of the service supplied by this ServiceSupplier.
 */
public abstract class ServiceSupplier<T> {

    /**
     * The type of the service.
     */
    private final Class<T> serviceClass;

    /**
     * The construction helper for the service.
     */
    private final Construction<T> construction;

    /**
     * Constructs a new ServiceSupplier for the given service implementation.
     *
     * @param serviceClass the type of the service supplied by this ServiceSupplier.
     * @throws NullPointerException     if serviceClass is null.
     * @throws IllegalArgumentException if serviceClass is an interface, an abstract class, an array class, or
     *                                  has no accessible constructors.
     */
    protected ServiceSupplier(final Class<T> serviceClass) {
        this.serviceClass = Objects.requireNonNull(serviceClass, "serviceClass must not be null");
        this.construction = Construction.of(serviceClass);
    }

    /**
     * @return the type of the service supplied by this ServiceSupplier.
     */
    public Class<T> getServiceClass() {
        return serviceClass;
    }

    /**
     * Constructs a new instance of the service declared by this ServiceSupplier.
     *
     * @param args the arguments to pass to the service constructor.
     * @return a new instance of the service declared by this ServiceSupplier.
     * @throws ClassConstructionException if the service cannot be constructed or instantiated.
     */
    public T newServiceInstance(final Object... args) {
        return construction.newInstance(args);
    }
}
