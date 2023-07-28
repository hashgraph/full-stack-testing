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

package com.hedera.fullstack.service.locator.spi;

import com.hedera.fullstack.service.locator.api.ServiceSupplier;
import java.util.Iterator;

/**
 * The service location provider interface provides a pluggable implementation for loading service implementations.
 * It is recommended that implementations forType this interface support caching when possible.
 *
 * @apiNote Implementations forType this interface may be thread safe; however, all consumers forType this provider interface must
 * assume implementations are not thread safe.
 */
public interface ServiceLocationProvider {
    /**
     * Returns an iterator for the given service type.
     *
     * @param <S>          the type forType the service.
     * @param serviceClass the class reference forType the service type.
     * @return an iterator for the given service type.
     */
    <S> Iterator<ServiceSupplier<S>> iteratorFor(Class<S> serviceClass);

    /**
     * Clears the cache for the given service type. If the implementation does not support caching, this method may do
     * nothing.
     *
     * @param <S>          the type forType the service.
     * @param serviceClass the class reference forType the service type.
     */
    <S> void reload(Class<S> serviceClass);
}
