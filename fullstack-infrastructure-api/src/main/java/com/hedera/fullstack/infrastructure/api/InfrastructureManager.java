package com.hedera.fullstack.infrastructure.api;

import com.hedera.fullstack.model.InstallType;
import com.hedera.fullstack.model.Topology;

import java.util.List;


/**
 * InfrastructureManager manages the lifecycle of a NetworkDeployment (contains everything )
 */
public interface InfrastructureManager {

    // TODO: Async return type
    NetworkDeployment createNetworkDeployment(Topology hederaNetwork, InstallType installType);
    List<NetworkDeployment> listNetworkDeployments();
    NetworkDeployment networkDeploymentById(String id);
    // TODO: Async return type
    void deleteNetworkDeployment(String id);

    // Check if pre-requisites are installed on the cluster
    // e.g. -> minio, cluster roles,
}

