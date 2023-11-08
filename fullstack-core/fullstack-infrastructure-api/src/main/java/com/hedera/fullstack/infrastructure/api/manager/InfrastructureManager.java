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

package com.hedera.fullstack.infrastructure.api.manager;

import com.hedera.fullstack.configuration.infrastructure.NetworkDeploymentConfiguration;
import com.hedera.fullstack.infrastructure.api.exceptions.InsufficientClusterResourcesException;
import com.hedera.fullstack.infrastructure.api.exceptions.InfrastructureException;
import com.hedera.fullstack.infrastructure.api.exceptions.InvalidConfigurationException;
import com.hedera.fullstack.infrastructure.api.exceptions.NetworkDeploymentNotFoundException;
import com.hedera.fullstack.infrastructure.api.model.NetworkDeployment;
import java.util.List;
import java.util.concurrent.Future;

/**
 * <p>InfrastructureManager is the main entry point into infrastructure management for FST </p>
 *
 * Responsibilities:
 * <ol>
 *  <li> Manages the lifecycle of a {@link NetworkDeployment}</li>
 *  <li> Acts as a registry for all {@link NetworkDeployment}s created by it</li></li>
 * </ol>
 *
 * <hr/>
 * <strong> About NetworkDeployments </strong>
 * <p>
 * A {@link NetworkDeployment} represents all the workloads and their components needed for a Hedera ecosystem. <br/>
 * Upon instantiation, the {@link NetworkDeployment} object can interact with its workloads and components directly
 * and does not need {@link InfrastructureManager}.
 * </p>
 */
public interface InfrastructureManager {

    /**
     * This is a synchronous version of {@link #createNetworkDeploymentAsync(NetworkDeploymentConfiguration)
     */
    default NetworkDeployment createNetworkDeployment(NetworkDeploymentConfiguration hederaNetwork)
            throws InvalidConfigurationException, InsufficientClusterResourcesException, InfrastructureException {
        return null;
    }

    /**
     * <p>Creates the {@link NetworkDeployment} based on the {@link NetworkDeploymentConfiguration} provided.
     * This is a long-running process.</p>
     * Note: the {@link NetworkDeployment} can be spread across multiple clusters and cloud providers.
     * @param hederaNetwork {@link NetworkDeploymentConfiguration} object containing all the configuration needed
     *                    to create the {@link NetworkDeployment}
     * @return a {@link NetworkDeployment} object representing the {@link NetworkDeployment} created
     * @throws InvalidConfigurationException if the {@link NetworkDeploymentConfiguration} is invalid
     * @throws InsufficientClusterResourcesException if there are not enough resources in the cluster to create the {@link NetworkDeployment}
     * @throws InfrastructureException if there is an error in the infrastructure low level implementation.
     */
    Future<NetworkDeployment> createNetworkDeploymentAsync(NetworkDeploymentConfiguration hederaNetwork)
            throws InvalidConfigurationException, InsufficientClusterResourcesException, InfrastructureException;

    /**
     * List all the {@link NetworkDeployment} instances created by this JVM process.
     * @return a list of all {@link NetworkDeployment}s instances provisioned by this JVM process.
     */
    List<NetworkDeployment> listNetworkDeployments();

    /**
     * Locates an existing {@link NetworkDeployment} using the provided identifier.
     * The identifier must be from a {@link NetworkDeployment} created by this Java process.
     * @param id  Unique identifier of the {@link NetworkDeployment}, the implementation
     *           will usually be a combination of namespace, job name and job id etc.
     * @return the {@link NetworkDeployment} associated with the provided identifier.
     * @throws NetworkDeploymentNotFoundException if the {@link NetworkDeployment} with the given id is not found
     */
    NetworkDeployment networkDeploymentById(String id) throws NetworkDeploymentNotFoundException;

    /**
     * Deletes the {@link NetworkDeployment} with the given id and all its workload replicas and components
     * @param id Unique identifier of the {@link NetworkDeployment}, the implementation
     *           will usually be a combination of namespace, job name and job id etc.
     * @return true if the {@link NetworkDeployment} was deleted successfully, false otherwise
     * @throws NetworkDeploymentNotFoundException if the {@link NetworkDeployment} with the given id is not found
     */
    Future<Boolean> deleteNetworkDeployment(String id) throws NetworkDeploymentNotFoundException;
}
