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

import com.hedera.fullstack.infrastructure.api.traits.KubernetesAware;
import java.util.List;

/**
 *  A logical representation of a single Kubernetes control plane.
 *
 * <ul>
 *    <li>is a set of physical or virtual machines which can be used to deploy {@link Workload}s</li>
 *    <li>can be a public or private cloud, or a bare metal cluster in any geography</li>
 *    <li>can host a subset of or all of the{@link Workload}s within a {@link NetworkDeployment}</li>
 *    <li> must be able to expose the {@link Component}s (ones which need) of {@link Workload}s in way that its
 *    reachable from {@link Component}s hosted on other {@link Cluster}s</li>
 * </ul>
 */
public interface Cluster extends KubernetesAware {

    /**
     * @return the {@link Workload}s hosted on this {@link Cluster}
     */
    List<Workload> listWorkloads();

    /**
     * @return the {@link Workload} hosted on this {@link Cluster} of the given type
     */
    <T extends Workload> T findWorkloadByType(Class<T> workloadType);
}
