package com.hedera.fullstack.infrastructure.api.providers;

import com.hedera.fullstack.infrastructure.api.Cluster;
import com.hedera.fullstack.infrastructure.api.NetworkDeployment;
import com.hedera.fullstack.infrastructure.api.model.Workload;
import com.hedera.fullstack.infrastructure.api.model.WorkloadReplica;
import com.hedera.fullstack.model.Topology;
import com.hedera.fullstack.resource.generator.api.PlatformConfiguration;

import java.util.List;
import java.util.Map;

public class HederaNetworkK8s implements NetworkDeployment {


    @Override
    public String getId() {
        return null;
    }

    @Override
    public String getName() {
        return null;
    }

    @Override
    public Map<String, String> getLabels() {
        return null;
    }

    @Override
    public Topology getTopology() {
        return null;
    }

    @Override
    public PlatformConfiguration.Builder getPlatformConfigurationBuilder() {
        return null;
    }

    @Override
    public List<Cluster> clusters() {
        return null;
    }

    @Override
    public List<Workload> workloads() {
        return null;
    }

    @Override
    public <T extends Workload> WorkloadReplica workloadByIndex(Class<T> workloadType, int index) {
        return null;
    }
}
