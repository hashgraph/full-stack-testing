package com.hedera.fullstack.infrastructure.api;

import com.hedera.fullstack.infrastructure.api.model.Workload;
import com.hedera.fullstack.infrastructure.api.model.WorkloadReplica;
import com.hedera.fullstack.model.DeploymentTopology;
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
     // DeploymentTopology -> lives in config
     DeploymentTopology getDeploymentTopology();

     PlatformConfiguration.Builder getPlatformConfigurationBuilder();

     // Components -> is infra specific and should live in infra
     // Component -> should be lowest level thing name
     // other names - Workload*,  fSTService , AService, XService, rejected - Facility

     List<Cluster> clusters();
     List<Workload> workloads();
    // <T extends Workload> T workloadByType(Class<T> workloadType);
     /// this returns the replicas
     // interface
     // class MirrorNode implements Workload
     //     m1, m2, m3 (replicas) -> instances of MirrorNode
     //   what is it responsible for, what approx methods, who uses it ?

     // class WorkloadReplicas (has global index as it appears on config txt)
     //  what is it responsible for, what approx methods, who uses it ?
     //  a generic concrete class with global index of its deployment

     <T extends Workload> WorkloadReplica workloadByIndex(Class<T> workloadType, int index);
}

enum WorkloadType {

     NETWORK_NODE,

     HAPROXY,
     ENVOY_PROXY,

     MIRROR_NODE_GRAPHQL,
     MIRROR_NODE_GRPC,
     MIRROR_NODE_ROSETTA,
     MIRROR_NODE_WEB3,
     MIRROR_NODE_REST,
     MIRROR_NODE_IMPORTER_MONITOR,
     MIRROR_NODE_IMPORTER,
     MIRROR_NODE_EXPLORER,
     MIRROR_NODE_REDIS,
     MIRROR_NODE_POSTGRES,

     MINIO_POOL,
}
