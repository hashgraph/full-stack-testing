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

import com.hedera.fullstack.infrastructure.api.exceptions.InstallationException;
import com.hedera.fullstack.infrastructure.api.traits.Labeled;
import com.hedera.fullstack.model.NetworkDeploymentConfiguration;
import com.hedera.fullstack.resource.generator.api.PlatformConfiguration;
import java.util.List;
import java.util.concurrent.Future;

/**
 * A NetworkDeployment represents all components needed for a Hedera ecosystem
 * <hr>
 * <p><strong>General</strong></p>
 * <ul>
 *     <li>A Network Deployment can be deployed across one or many {@link Cluster}s. <br/>
 *     These cluster may be on different cloud provider and geographically distributed
 *     </li>
 *
 *      <li> A Cluster can have one or many {@link Workload}s
 *      </li>
 *
 *      <li>
 *          A Workload can have one or many {@link WorkloadReplica}s
 *      </li>
 *
 *      <li>
 *          A WorkloadReplica is a single instance of a Workload
 *      </li>
 *
 *      <li>
 *          A WorkloadReplica can have one or many {@link Component}s
 *      </li>
 *
 *      <li>
 *          A Component is the lowest level of abstraction at the infrastructure level.<br/>
 *          A Component depending on its Traits can allow different operations on it.
 *      </li>
 * </ul>
 *
 *
 * <p>
 * Here is a high level overview:
 * <table border="1">
 *   <tr>
 *     <th>Workloads</th>
 *     <th>Workload Replicas</th>
 *     <th>Components</th>
 *   </tr>
 *   <tr>
 *     <td>NetworkNode</td>
 *     <td>1+</td>
 *     <td>Node, RecordStreamUploader, EventStreamUploader, BackupUploader, Envoy, Haproxy</td>
 *   </tr>
 *   <tr>
 *     <td>MirrorNode</td>
 *     <td>1</td>
 *     <td>Importer, REST, GRPC, Rosetta, Web3, Redis, Postgres</td>
 *   </tr>
 *   <tr>
 *     <td>MirrorNodeExplorer</td>
 *     <td>1</td>
 *     <td></td>
 *   </tr>
 *   <tr>
 *     <td>Minio</td>
 *     <td>1</td>
 *     <td></td>
 *   </tr>
 *   <tr>
 *     <td>JSONRPCRelay</td>
 *     <td>1+</td>
 *     <td></td>
 *   </tr>
 * </table>
 * </p>
 **/
public interface NetworkDeployment extends Labeled {

    String getId();

    String getName();

    NetworkDeploymentConfiguration getNetworkDeploymentConfiguration();

    PlatformConfiguration.Builder getPlatformConfigurationBuilder();

    List<Cluster> clusters();

    List<Workload> workloads();

    <T extends Workload> WorkloadReplica<T> workloadByIndex(Class<T> workloadType, int index);

    <T extends Workload> List<WorkloadReplica<T>> workloadsByCluster(Class<T> workloadType, Cluster cluster);

    Future<Boolean> installClusterSetupWorkloads() throws InstallationException;
}
