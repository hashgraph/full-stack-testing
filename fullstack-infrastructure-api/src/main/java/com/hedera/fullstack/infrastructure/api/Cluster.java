package com.hedera.fullstack.infrastructure.api;

import com.hedera.fullstack.infrastructure.api.model.Workload;
import com.hedera.fullstack.infrastructure.api.model.traits.KubernetesAware;

import java.util.List;

public interface Cluster extends KubernetesAware {
    List<Workload> listWorkloads();
    <T extends Workload> T findWorkloadByType(Class<T> workloadType);
}
