package com.hedera.fullstack.infrastructure.api;

import com.hedera.fullstack.infrastructure.api.model.Workload;
import com.hedera.fullstack.infrastructure.api.model.WorkloadReplica;
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
public interface NetworkDeployment {

     String getId();
     String getName();

     // in multi/single cluster env -> to be set on the namespace, will same across all cluster namespaces
     Map<String,String> getLabels();

     Topology getTopology();

     PlatformConfiguration.Builder getPlatformConfigurationBuilder();

     // Components -> is infra specific and should live in infra
     // Component -> should be lowest level thing name
     // other names - Workload*,  fSTService , AService, XService, rejected - Facility

     List<Cluster> clusters();
     List<Workload> workloads();
     <T extends Workload> WorkloadReplica<T> workloadByIndex(Class<T> workloadType, int index);
}
