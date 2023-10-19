package com.hedera.fullstack.infrastructure.api.model;

import com.hedera.fullstack.infrastructure.api.Cluster;

import java.util.List;

public class Haproxy implements Workload{
    @Override
    public Cluster cluster() {
        return null;
    }

    @Override
    public List<WorkloadReplica> replicas() {
        return null;
    }
}
