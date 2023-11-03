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

package com.hedera.fullstack.infrastructure.core;

import com.hedera.fullstack.configuration.model.NetworkDeploymentConfiguration;
import com.hedera.fullstack.infrastructure.api.exceptions.DeploymentLimitReachedException;
import com.hedera.fullstack.infrastructure.api.exceptions.InfrastructureException;
import com.hedera.fullstack.infrastructure.api.exceptions.InvalidConfigurationException;
import com.hedera.fullstack.infrastructure.api.manager.InfrastructureManager;
import com.hedera.fullstack.infrastructure.api.model.NetworkDeployment;
import com.hedera.fullstack.infrastructure.core.exceptions.NotImplementedException;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Future;

public class InfrastructureManagerImpl implements InfrastructureManager {

    @Override
    public Future<NetworkDeployment> createNetworkDeploymentAsync(NetworkDeploymentConfiguration hederaNetwork)
            throws InvalidConfigurationException, DeploymentLimitReachedException, InfrastructureException {
        throw new NotImplementedException();
    }

    @Override
    public List<NetworkDeployment> listNetworkDeployments() {
        throw new NotImplementedException();
    }

    @Override
    public NetworkDeployment networkDeploymentById(String id) {
        throw new NotImplementedException();
    }

    @Override
    public CompletableFuture<Boolean> deleteNetworkDeployment(String id) {
        throw new NotImplementedException();
    }
}
