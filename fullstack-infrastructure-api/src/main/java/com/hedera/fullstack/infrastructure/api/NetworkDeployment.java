package com.hedera.fullstack.infrastructure.api;

import com.hedera.fullstack.infrastructure.api.model.Workload;
import com.hedera.fullstack.infrastructure.api.model.WorkloadReplica;
import com.hedera.fullstack.infrastructure.api.model.traits.Labeled;
import com.hedera.fullstack.model.Topology;
import com.hedera.fullstack.resource.generator.api.PlatformConfiguration;

import java.util.List;
import java.util.Map;

/**
 Represents a hedera network / deployment / infrastructure
 The hedera infrastructure means
  - hedera node
  - sidecars
  - minio
  - mirror node
  - mirror node explorer

**/
public interface NetworkDeployment extends Labeled {

     String getId();
     String getName();

     Topology getTopology();

     PlatformConfiguration.Builder getPlatformConfigurationBuilder();

     List<Cluster> clusters();
     List<Workload> workloads();
     <T extends Workload> WorkloadReplica<T> workloadByIndex(Class<T> workloadType, int index);
     <T extends Workload> List<WorkloadReplica<T>> workloadByCluster(Class<T> workloadType,Cluster cluster);
}
