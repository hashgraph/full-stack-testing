
Perf CLI Special case
----
- N (eg. 31) machines, each runs a k8s cluster
   all 31 nodes form a -> network deployment
   -> we cannot necessarily use 1 k8s for 30 nodes 
   -> they could be heterogenous k8s nodes
      -> aws + gcp + kind etc.
   -> This physical infra (k8s cluster etc.) is not created by FST
   -> but FST will deploy using helm on these 31 k8s clusters
   -> K8s is the lowest layer, we dont need to support VMs or anything else
-> upper layers should not be infra details aware
-> make it generic enough to support something other than k8s

2 more services coming (keep that in mind while design)
- graph (graphql ...)
- -> https://sourcify.dev/
- Assumption for design: 1 or more component per quarter


Components
-> should allow operations on themselves
-> even delete me (mostly NO_OP) -> default empty method in the interface
   -> setup themsevles
   -> configure themselves(topology)
-> we dont want to leave lingering resources on a shared cluster

(kind of like a component) Create a resource on the fly outside of helm chart
-> debug / tools container
-> something outside of helm for very specific use cases

perfcli --config <config> run

Network Deployment (can use many k8s clusters) -> 1..* Clusters --> 1..* Workload -> 1..* replicas -> 1..* components

NetworkNode -> 1..5 --> each has k8s service + pod
MirrorNode -> 0..1 --> each has k8s service + pod

1 replicas of mirror Node
 -> component rest -> 5 k8s pod
 -> 1 k8s service

NetworkDeploy1 -> Cluster 1 -> MirrorNode -> replica 1 -> REST Service --> aware of multiple pods via traits, actual operations are traited out

- convenience methods
   - e.g. shutdown NODE 5, "Node 5" is a addressable, should be a stable concept
   - because they were asking for 5 nodes and they want to refer to each node by number
   - its also how they appear in the address book, it has to match with it

## Components in FST

basically I have to be able to reach individual POD
and I have to able to operate on individual services
A component is  [ pod from SS or deployment + service ]

We have to decide on level of abstraction of component
is mirror node a component 
or is mirror node.importer a component

basically we should use a component to describe a thin layer over a k8s deployed pod->multiple containers
and how reach it i.e service (think about multiple services)

how to model something outside of that
can it model scenarios like -> 1 pod -> multiple services ?

Namespace
 - NetworkNode [ 1 Pod [ multiple containers ] + 1 Service ]
   - 
 - Envoy [ 1 Deployment Pod  = 3 replicas + 1 Service ]
 - Haproxy [ 1 Deployment Pod = + 1 Service ]
Via child charts, minio node components
 - minio-pool-1-0, 1
Via child charts, mirror node components
 - Importer
 - grpc
 - graphql
 - rest
 - rest-monitor
 - rosetta
 - web3
 - Postgres [ multiple pods ]
   - pgpool
   - postgres-0, 1, 2 ...
 - Redis



public enum Workload {
NODE_SOFTWARE_POD,

    // This could be better nested, but this may be the right abstraction we need
    NODE_SOFTWARE_POD_SIDECAR_STATE_BACKUP_UPLOADER,
    NODE_SOFTWARE_POD_SIDECAR_RECORD_STREAM_UPLOADER,
    NODE_SOFTWARE_POD_SIDECAR_SIDECAR_STREAM_UPLOADER,
    NODE_SOFTWARE_POD_SIDECAR_POST_CONSENSUS_UPLOADER,

    MINIO_DEPLOYMENT,

    MIRROR_NODE_DEPLOYMENT_IMPORTER,
    MIRROR_NODE_DEPLOYMENT_REST_API,
    MIRROR_NODE_DEPLOYMENT_DATABASE,
    MIRROR_NODE_DEPLOYMENT_REDIS,
    MIRROR_NODE_EXPLORER,
    JSON_RPC_RELAY,
    ENVOY_PROXY,
    HAPROXY,
}


---
we should hardcode components because they would not change often

