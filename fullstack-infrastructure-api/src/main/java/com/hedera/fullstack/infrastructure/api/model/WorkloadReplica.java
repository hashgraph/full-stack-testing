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

/**
 * A unique indexed instance of {@link Workload}
 * @param <T> type of the workload
 */
public class WorkloadReplica<T extends Workload> {

    private List<Component> components;
    // global index across all clusters in the NetworkDeployment
    private final int index;

    public int index() {
        return index;
    }

    public WorkloadReplica(List<Component> components, int index) {
        this.components = components;
        this.index = index;
    }

    public void addComponent(Component component) {
        components.add(component);
    }

    public List<Component> getComponents() {
        return components;
    }

    @SuppressWarnings("unchecked") // safe since we filter out the componentType of type C
    public <C extends Component> C getComponentByType(Class<C> componentType) {
        return (C) components.stream()
                .filter(componentType::isInstance)
                .findFirst()
                .get();
    }
}
