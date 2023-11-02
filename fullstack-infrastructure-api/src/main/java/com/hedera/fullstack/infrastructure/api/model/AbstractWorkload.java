package com.hedera.fullstack.infrastructure.api.model;

import java.util.List;

public class AbstractWorkload<T extends Workload> implements Workload {

    List<WorkloadReplica<T>> replicas;
    Cluster cluster;


    @Override
    public Cluster cluster() {
        return cluster;
    }

    @Override
    public List<WorkloadReplica<T>> replicas() {
        return replicas;
    }

}
