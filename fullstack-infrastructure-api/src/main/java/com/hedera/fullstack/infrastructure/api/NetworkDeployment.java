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

package com.hedera.fullstack.infrastructure.api;

import com.hedera.fullstack.infrastructure.api.model.Workload;
import com.hedera.fullstack.infrastructure.api.model.WorkloadReplica;
import com.hedera.fullstack.infrastructure.api.model.traits.Labeled;
import com.hedera.fullstack.model.Topology;
import com.hedera.fullstack.resource.generator.api.PlatformConfiguration;
import java.util.List;

/**
 * Represents a hedera network / deployment / infrastructure
 * The hedera infrastructure means
 * - hedera node
 * - sidecars
 * - minio
 * - mirror node
 * - mirror node explorer
 *
 **/
public interface NetworkDeployment extends Labeled {

    String getId();

    String getName();

    Topology getTopology();

    PlatformConfiguration.Builder getPlatformConfigurationBuilder();

    List<Cluster> clusters();

    List<Workload> workloads();

    <T extends Workload> WorkloadReplica<T> workloadByIndex(Class<T> workloadType, int index);

    <T extends Workload> List<WorkloadReplica<T>> workloadByCluster(Class<T> workloadType, Cluster cluster);
}
