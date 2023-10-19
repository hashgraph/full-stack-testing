package com.hedera.fullstack.infrastructure.api;

import com.hedera.fullstack.infrastructure.api.model.Workload;

import java.util.List;

public interface Cluster {
    List<Workload> listWorkloads();
    <T extends Workload> T findWorkloadByType(Class<T> workloadType);
}
