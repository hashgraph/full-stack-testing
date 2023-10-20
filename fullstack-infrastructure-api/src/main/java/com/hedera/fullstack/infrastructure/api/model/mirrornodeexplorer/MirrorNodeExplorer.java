package com.hedera.fullstack.infrastructure.api.model.mirrornodeexplorer;

import com.hedera.fullstack.infrastructure.api.Cluster;
import com.hedera.fullstack.infrastructure.api.model.Workload;
import com.hedera.fullstack.infrastructure.api.model.WorkloadReplica;

import java.util.List;

public class MirrorNodeExplorer implements Workload {
    @Override
    public Cluster cluster() {
        return null;
    }

    @Override
    public List<WorkloadReplica> replicas() {
        return null;
    }
}
