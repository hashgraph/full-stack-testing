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

import com.hedera.fullstack.infrastructure.api.exceptions.DeploymentLimitReachedException;
import com.hedera.fullstack.infrastructure.api.exceptions.InfrastructureException;
import com.hedera.fullstack.infrastructure.api.exceptions.InvalidConfigurationException;
import com.hedera.fullstack.infrastructure.api.exceptions.NetworkDeploymentNotFoundException;
import com.hedera.fullstack.infrastructure.api.model.NetworkDeployment;
import com.hedera.fullstack.model.NetworkDeploymentConfiguration;
import java.util.List;
import java.util.concurrent.Future;

/**
 * InfrastructureManager is the main entry point into infrastructure management for FST <br/>
 * <br/>
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

    default NetworkDeployment createNetworkDeployment(NetworkDeploymentConfiguration hederaNetwork)
            throws InvalidConfigurationException, DeploymentLimitReachedException, InfrastructureException {
        return null;
    }

    // TODO: streaming logs while provisioning and deleting
    /**
     * Creates the {@link NetworkDeployment} based on the {@link NetworkDeploymentConfiguration} provided.
     * This is a long running process, expected time is in the order of a few minutes.
     * Note: the {@link NetworkDeployment} can be spread across multiple clusters and cloud providers.
     */
    Future<NetworkDeployment> createNetworkDeploymentAsync(NetworkDeploymentConfiguration hederaNetwork)
            throws InvalidConfigurationException, DeploymentLimitReachedException, InfrastructureException;

    /**
     * List all the {@link NetworkDeployment}s created by this InfrastructureManager
     * TODO: --> @return a list of {@link NetworkDeployment}s
     */
    List<NetworkDeployment> listNetworkDeployments();

    /**
     * Returns the {@link NetworkDeployment} with the given id
     * @param id  Unique identifier of the {@link NetworkDeployment}, the implementation
     *           will usually be a combination of namespace, job name and job id etc.
     * @return the {@link NetworkDeployment} with the given id
     * @throws NetworkDeploymentNotFoundException
     */
    NetworkDeployment networkDeploymentById(String id) throws NetworkDeploymentNotFoundException;

    /**
     * Deletes the {@link NetworkDeployment} with the given id and all its workload replicas and components
     * @param id Unique identifier of the {@link NetworkDeployment}, the implementation
     *           will usually be a combination of namespace, job name and job id etc.
     * @return true if the {@link NetworkDeployment} was deleted successfully, false otherwise
     * @throws NetworkDeploymentNotFoundException
     */
    Future<Boolean> deleteNetworkDeployment(String id) throws NetworkDeploymentNotFoundException;
}
