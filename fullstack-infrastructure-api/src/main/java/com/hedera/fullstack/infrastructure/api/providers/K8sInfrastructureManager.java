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

package com.hedera.fullstack.infrastructure.api.providers;

import com.hedera.fullstack.infrastructure.api.InfrastructureManager;
import com.hedera.fullstack.infrastructure.api.NetworkDeployment;
import com.hedera.fullstack.model.InstallType;
import com.hedera.fullstack.model.Topology;
import com.hedera.fullstack.resource.generator.api.ResourceUtils;
import java.util.List;

public class K8sInfrastructureManager implements InfrastructureManager {
    ResourceUtils resources;

    @Override
    public NetworkDeployment createNetworkDeployment(Topology hederaNetwork, InstallType installType) {
        return null;
    }

    @Override
    public List<NetworkDeployment> listNetworkDeployments() {
        return null;
    }

    @Override
    public NetworkDeployment networkDeploymentById(String id) {
        return null;
    }

    @Override
    public void deleteNetworkDeployment(String id) {}
}
