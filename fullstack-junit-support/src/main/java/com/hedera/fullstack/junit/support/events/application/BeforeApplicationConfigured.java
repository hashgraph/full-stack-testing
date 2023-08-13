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

package com.hedera.fullstack.junit.support.events.application;

/**
 * Defines an extension point for the application lifecycle which is invoked before the application node configuration
 * is rendered and deployed to the physical environment. This event is invoked for each node in the application topology.
 * <p>
 * Implementations of this extension point are expected to be idempotent and should only modify the configuration
 * supplied as method arguments. Mutating state other than the supplied configuration is not recommended and may lead to
 * unexpected results.
 * <p>
 * At the time of extension point invocation, it is guaranteed that the defaults have been applied and any class or
 * method level annotations have been applied to the configuration.
 */
public interface BeforeApplicationConfigured extends ApplicationEvent {

    /**
     * Invoked before the application node configuration is rendered and deployed to the physical environment.
     *
     * @param index the index of the node in the application topology.
     * @param node the application node.
     * @param config the application node configuration.
     */
    void beforeApplicationConfigured(int index, Object node, Object config);
}
