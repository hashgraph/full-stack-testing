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

import com.hedera.fullstack.configuration.infrastructure.NetworkDeploymentConfiguration;
import com.hedera.fullstack.infrastructure.api.exceptions.InfrastructureException;
import com.hedera.fullstack.infrastructure.api.exceptions.InstallationException;
import com.hedera.fullstack.infrastructure.api.exceptions.NetworkDeploymentNotFoundException;
import com.hedera.fullstack.infrastructure.api.traits.Labeled;
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

    /**
     * Retrieves the unique identifier for this {@link NetworkDeployment}.
     * @return a unique identifier of the {@link NetworkDeployment}.
     */
    String id();

    /**
     * Retrieves the name of this {@link NetworkDeployment}.
     * @return the name of the {@link NetworkDeployment}.
     */
    String name();

    /**
     * Retrieves the configuration of this  {@link NetworkDeployment}.
     * @return the configuration of the  {@link NetworkDeployment}.
     */
    NetworkDeploymentConfiguration configuration();

    /**
     * Retrieves the platform configuration builder of this  {@link NetworkDeployment}.
     * @return the platform configuration builder of the  {@link NetworkDeployment}.
     */
    PlatformConfiguration.Builder platformConfigurationBuilder();

    /**
     * Retrieves all the {@link Cluster}s across which this {@link NetworkDeployment} is deployed.
     * @return a list of {@link Cluster}s across which this {@link NetworkDeployment} is deployed.
     */
    List<Cluster> clusters();

    /**
     * Retrieves all the {@link Workload}s across all the clusters where this {@link NetworkDeployment} is deployed.
     * @return a list of {@link Workload}s across all the clusters where this {@link NetworkDeployment} is deployed.
     */
    List<Workload> workloads();

    /**
     * Retrieves {@link WorkloadReplica} at an index of a specific type of {@link Workload}
     * @param workloadType the type of the {@link Workload}
     * @param index  the index of the {@link WorkloadReplica}
     * @return  the {@link WorkloadReplica}
     * @param <T>  the type of the {@link Workload}
     */
    <T extends Workload> WorkloadReplica<T> workloadByIndex(Class<T> workloadType, int index);

    /**
     * Retrieves {@link WorkloadReplica}s of a specific type of {@link Workload} on a specific {@link Cluster}
     * @param workloadType  the type of the {@link Workload}
     * @param cluster the {@link Cluster} on which the {@link WorkloadReplica} is deployed
     * @return  the {@link WorkloadReplica}
     * @param <T>  the type of the {@link Workload}
     */
    <T extends Workload> List<WorkloadReplica<T>> workloadsByCluster(Class<T> workloadType, Cluster cluster);

    Future<Boolean> installClusterSetupWorkloads() throws InstallationException;

    /**
     * Deletes this {@link NetworkDeployment} and all its workload replicas and components
     * If the operation fails due to an exception it will be wrapped in an {@code ExecutionException}
     * that can be caught when calling {@code Future.get}.
     *
     * @return a {@code Future} object representing the pending completion of the delete operation.
     *         The {@code Future}'s {@code get} method will return {@code true} if the resource
     *         was successfully deleted, or {@code false} if it did not exist or had been already
     *         removed.
     */
    Future<Void> delete();
}
