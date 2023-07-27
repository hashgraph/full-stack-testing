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
 * @param <S> the type of the service supplied by this ServiceSupplier.
 */
public final class ServiceSupplier<S> {
    /**
     * The type of the service implementation.
     */
    private final Class<? extends S> type;

    /**
     * The construction helper for the service.
     */
    private final Construction<? extends S> construction;

    /**
     * Constructs a new ServiceSupplier for the given service implementation.
     *
     * @param type the type of the service implementation.
     * @throws NullPointerException     if serviceClass is null.
     * @throws IllegalArgumentException if serviceClass is an interface, an abstract class, an array class, or
     *                                  has no accessible constructors.
     */
    public ServiceSupplier(final Class<? extends S> type) {
        this.type = Objects.requireNonNull(type, "type must not be null");
        this.construction = Construction.of(type);
    }

    /**
     * @return the type of the service implementation.
     */
    public Class<? extends S> type() {
        return type;
    }

    /**
     * Constructs a new instance of the service implementation using the zero argument constructor.
     *
     * @return a new instance of the service declared by this ServiceSupplier.
     * @throws ClassConstructionException if the service cannot be constructed or instantiated.
     */
    public S get() {
        return construction.newInstance();
    }

    /**
     * Constructs a new instance of the service implementation and casts the result to the specified type.
     *
     * @param <T>  the subclass or sub-interface to cast the service implement.
     * @param args the arguments to pass to the service constructor.
     * @return a new instance of the service declared by this ServiceSupplier.
     * @throws ClassConstructionException if the service cannot be constructed or instantiated.
     * @throws ClassCastException         if the service cannot be cast to the specified type.
     */
    @SuppressWarnings("unchecked")
    public <T extends S> T cast(final Object... args) {
        return (T) newServiceInstance(args);
    }

    /**
     * Constructs a new instance of the service implementation.
     *
     * @param args the arguments to pass to the service constructor.
     * @return a new instance of the service declared by this ServiceSupplier.
     * @throws ClassConstructionException if the service cannot be constructed or instantiated.
     */
    public S newServiceInstance(final Object... args) {
        return construction.newInstance(args);
    }
}
