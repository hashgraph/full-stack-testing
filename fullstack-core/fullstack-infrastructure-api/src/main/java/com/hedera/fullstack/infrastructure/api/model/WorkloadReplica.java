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

package com.hedera.fullstack.infrastructure.api.model;

import java.util.List;
import java.util.Optional;

/**
 * A unique indexed instance of {@link Workload}
 * @param <T> type of the workload
 */
public class WorkloadReplica<T extends Workload> {

    private final List<Component> components;

    // global index across all clusters in the NetworkDeployment
    private final int index;

    /**
     * Retrieves the index of this {@link WorkloadReplica} in the {@link Workload}
     * @return the index of this replica
     */
    public int index() {
        return index;
    }

    /**
     * Creates a new {@link WorkloadReplica} with the given components and index.
     * @param components the {@link Component}s of this Workload Replica
     * @param index the index of this Workload Replica
     */
    public WorkloadReplica(final List<Component> components, final int index) {
        this.components = components;
        this.index = index;
    }

    /**
     * Adds a {@link Component} to this {@link WorkloadReplica}
     * @param component the {@link Component} to add
     */
    public void addComponent(Component component) {
        components.add(component);
    }

    /**
     * Retrieves all {@link Component}s of this {@link WorkloadReplica}
     * @return the {@link Component}s of this {@link WorkloadReplica}
     */
    public List<Component> components() {
        return components;
    }

    @SuppressWarnings("unchecked") // safe since we filter out the componentType of type C
    public <C extends Component> Optional<C> componentByType(Class<C> componentType) {
        return  components.stream()
                .filter(componentType::isInstance)
                .map(componentType::cast)
                .findFirst();
    }
}
