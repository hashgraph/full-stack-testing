package com.hedera.fullstack.infrastructure.api.model;

import com.hedera.fullstack.infrastructure.api.Cluster;

import java.util.List;

public interface Workload {

    // This workload belong to which cluster
    Cluster cluster();

    List<WorkloadReplica> replicas();
}

/*

*/
