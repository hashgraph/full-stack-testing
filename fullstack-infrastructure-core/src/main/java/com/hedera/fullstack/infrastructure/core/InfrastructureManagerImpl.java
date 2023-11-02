package com.hedera.fullstack.infrastructure.core;

import com.hedera.fullstack.helm.client.HelmClient;
import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.model.chart.Release;
import com.hedera.fullstack.infrastructure.api.manager.InfrastructureManager;
import com.hedera.fullstack.infrastructure.api.model.Cluster;
import com.hedera.fullstack.infrastructure.api.model.NetworkDeployment;
import com.hedera.fullstack.infrastructure.api.model.Workload;
import com.hedera.fullstack.infrastructure.api.model.WorkloadReplica;
import com.hedera.fullstack.infrastructure.api.model.mirrornode.MirrorNode;
import com.hedera.fullstack.infrastructure.api.model.networknode.NetworkNode;
import com.hedera.fullstack.model.InstallType;
import com.hedera.fullstack.model.NetworkDeploymentConfiguration;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public class InfrastructureManagerImpl implements InfrastructureManager {

    HelmClient helmClient;

    @Override
    public CompletableFuture<NetworkDeployment> createNetworkDeploymentAsync(NetworkDeploymentConfiguration hederaNetwork, InstallType installType) {
        Release release = helmClient.installChart("0.0.1", new Chart("cd", "repo"));
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
    public CompletableFuture<Boolean> deleteNetworkDeployment(String id) {
        return null;
    }

    @Override
    public CompletableFuture<Boolean> installClusterSetupComponents() {
        return null;
    }
}
