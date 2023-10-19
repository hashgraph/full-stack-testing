package com.hedera.fullstack.infrastructure.api.providers;

import com.hedera.fullstack.model.InstallType;
import com.hedera.fullstack.model.Topology;
import com.hedera.fullstack.infrastructure.api.InfrastructureManager;
import com.hedera.fullstack.infrastructure.api.NetworkDeployment;
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
    public void deleteNetworkDeployment(String id) {

    }
}
