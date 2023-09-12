package com.hedera.fullstack.infrastructure.api;

import com.hedera.fullstack.infrastructure.api.model.INSTALL_TYPE;
import com.hedera.fullstack.infrastructure.api.model.Topology;

import java.util.List;


/**
 * InfrastructureManager manages the lifecycle of a NetworkDeployment (contains everything )
 */
public interface InfrastructureManager {

    // TODO: Async return type
    NetworkDeployment createNetworkDeployment(Topology hederaNetwork, INSTALL_TYPE installType);
    List<NetworkDeployment> getNetworkDeployments();
    NetworkDeployment getNetworkDeployments(String id);
    // TODO: Async return type
    void deleteNetworkDeployments(String id);

}

