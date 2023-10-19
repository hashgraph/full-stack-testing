package com.hedera.fullstack.infrastructure.api.model.mirrornode;

import com.hedera.fullstack.infrastructure.api.Cluster;
import com.hedera.fullstack.infrastructure.api.model.Workload;
import com.hedera.fullstack.infrastructure.api.model.WorkloadReplica;

import java.util.List;

public class MirrorNode implements Workload {
    /*
    - Importer, REST, GRPC, Rosetta, Web3
    */
    @Override
    public Cluster cluster() {
        return null;
    }

    @Override
    public List<WorkloadReplica> replicas() {
        return null;
    }

}
