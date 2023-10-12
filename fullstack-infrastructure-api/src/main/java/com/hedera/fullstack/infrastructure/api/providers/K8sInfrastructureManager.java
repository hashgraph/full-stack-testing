package com.hedera.fullstack.infrastructure.api.providers;

import com.hedera.fullstack.model.INSTALL_TYPE;
import com.hedera.fullstack.model.Topology;
import com.hedera.fullstack.infrastructure.api.InfrastructureManager;
import com.hedera.fullstack.infrastructure.api.NetworkDeployment;
import com.hedera.fullstack.resource.generator.api.ResourceUtils;

import java.util.List;

public class K8sInfrastructureManager implements InfrastructureManager {
    ResourceUtils resources;

    @Override
    public NetworkDeployment createNetworkDeployment(Topology hederaNetwork, INSTALL_TYPE installType) {
        return null;
    }

    @Override
    public List<NetworkDeployment> getNetworkDeployments() {
        return null;
    }

    @Override
    public NetworkDeployment getNetworkDeployment(String id) {
        return null;
    }

    @Override
    public void deleteNetworkDeployment(String id) {

    }
}
