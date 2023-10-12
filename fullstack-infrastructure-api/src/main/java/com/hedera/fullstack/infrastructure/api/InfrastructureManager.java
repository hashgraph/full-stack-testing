package com.hedera.fullstack.infrastructure.api;

import com.hedera.fullstack.model.INSTALL_TYPE;
import com.hedera.fullstack.model.Topology;

import java.util.List;


/**
 * InfrastructureManager manages the lifecycle of a NetworkDeployment (contains everything )
 */
public interface InfrastructureManager {
    // TODO: Async return type
    NetworkDeployment createNetworkDeployment(Topology hederaNetwork, INSTALL_TYPE installType);
    List<NetworkDeployment> getNetworkDeployments();
    NetworkDeployment getNetworkDeployment(String id);
    // TODO: Async return type
    void deleteNetworkDeployment(String id);

    // Check if pre-requisites are installed on the cluster
    // e.g. -> minio, cluster roles,
}

