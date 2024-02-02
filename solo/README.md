# Solo

An opinionated CLI tool to deploy and manage private Hedera Networks.

## Requirements

* Node(^18.19.0) (*lts/hydrogen*)
* Helm(^3.14.0)
* Kubectl(^1.28.2)

## Setup

* Install [Node](https://nodejs.org/en/download). You may also use [nvm](https://github.com/nvm-sh/nvm) to manage different Node versions locally:

```
$ nvm install lts/hydrogen
$ nvm use lts/hydrogen 
```

* Install [kubectl](https://kubernetes.io/docs/tasks/tools/)
* Install [helm](https://helm.sh/docs/intro/install/)
* Useful tools (Optional)
  * Install [kind](https://kind.sigs.k8s.io/)
  * Install [k9s](https://k9scli.io/)
  * Install [kubectx](https://github.com/ahmetb/kubectx)

## Install Solo

* Run `npm install -g @hashgraph/solo`

## Setup Kubernetes cluster

* You may use remote kubernetes cluster. In this case, ensure kubernetes context is set up correctly.
  Check and select appropriate kubernetes context using `kubectx` command as below:

```
$ kubectx <context-name>
```

* For a local cluster, you may use [kind](https://kind.sigs.k8s.io/) and [kubectl](https://kubernetes.io/docs/tasks/tools/) to create a cluster and namespace as below.
  * In this case, ensure your Docker has enough resources (e.g. Memory >=8Gb, CPU: >=4).

```
$ export SOLO_CLUSTER_NAME=solo
$ export SOLO_NAMESPACE=solo
$ kind create cluster -n "${SOLO_CLUSTER_NAME}" 
$ kubectl create ns "${SOLO_NAMESPACE}" 

Creating cluster "solo" ...
 ✓ Ensuring node image (kindest/node:v1.27.3) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-solo"
You can now use your cluster with:

kubectl cluster-info --context kind-solo

Have a nice day! 👋
namespace/solo created
```

You may now view pods in your cluster using `k9s -A` as below:

```
 Context: kind-solo                                <0> all       <a>      Attac… ____  __.________
 Cluster: kind-solo                                <1> default   <ctrl-d> Delete|    |/ _/   __   \______
 User:    kind-solo                                              <d>      Descri|      < \____    /  ___/
 K9s Rev: v0.27.4 ⚡️v0.31.7                                      <e>      Edit  |    |  \   /    /\___ \
 K8s Rev: v1.27.3                                                <?>      Help  |____|__ \ /____//____  >
 CPU:     n/a                                                    <ctrl-k> Kill          \/            \/
 MEM:     n/a
┌───────────────────────────────────────────── Pods(all)[9] ─────────────────────────────────────────────┐
│ NAMESPACE↑          NAME                                        PF READY RESTARTS STATUS   IP          │
│ kube-system         coredns-5d78c9869d-8x4zm                    ●  1/1          0 Running  10.244.0.4  │
│ kube-system         coredns-5d78c9869d-64lm6                    ●  1/1          0 Running  10.244.0.3  │
│ kube-system         etcd-solo-control-plane                     ●  1/1          0 Running  172.18.0.2  │
│ kube-system         kindnet-6cng4                               ●  1/1          0 Running  172.18.0.2  │
│ kube-system         kube-apiserver-solo-control-plane           ●  1/1          0 Running  172.18.0.2  │
│ kube-system         kube-controller-manager-solo-control-plane  ●  1/1          0 Running  172.18.0.2  │
│ kube-system         kube-proxy-sg88w                            ●  1/1          0 Running  172.18.0.2  │
│ kube-system         kube-scheduler-solo-control-plane           ●  1/1          0 Running  172.18.0.2  │
│ local-path-storage  local-path-provisioner-6bc4bddd6b-7cv7c     ●  1/1          0 Running  10.244.0.2  │
│
```

## Generate Node Keys

### Legacy keys (.pfx file)

All Hedera platform versions support the legacy `.pfx` formatted key files.

Unfortunately `solo` is not able to generate legacy `PFX` formatted keys. However, if `curl`, `keytool` and `openssl`
are installed, you may run the following command to generate the pfx formatted gossip keys in the default
cache directory (`$HOME/.solo/cache/keys`):

```
# Option - 1: Generate keys for default node IDs: node0,node1,node2
/bin/bash -c "$(curl -fsSL  https://raw.githubusercontent.com/hashgraph/full-stack-testing/main/solo/test/scripts/gen-legacy-keys.sh)"

# Option - 2: Generate keys for custom node IDs
curl https://raw.githubusercontent.com/hashgraph/full-stack-testing/main/solo/test/scripts/gen-legacy-keys.sh -o gen-legacy-keys.sh
chmod +x gen-legacy-keys.sh
./gen-legacy-keys.sh alice,bob,carol
```

### Standard keys (.pem file)

These keys are supported by Hedera platform >=`0.47.0-alpha.0`.
You may run `solo node keys --gossip-keys --tls-keys --key-format pem -i node0,node1,node2` command to generate the required node keys.

# Examples

## Example - 1: Deploy a private Hedera network (version `0.42.5`)

* Initialize `solo` with tag `v0.42.5` and list of node names `node0,node1,node2`:

```
$ solo init -t v0.42.5 -i node0,node1,node2 -n "${SOLO_NAMESPACE}" 

******************************* Solo *********************************************
Version                 : 0.19.1
Kubernetes Context      : kind-solo
Kubernetes Cluster      : kind-solo
Kubernetes Namespace    : solo
**********************************************************************************
✔ Setup home directory and cache
✔ Setup config manager
✔ Check dependencies
  ✔ Check dependency: helm
✔ Setup chart manager [1s]
```

* Generate `pfx` node keys (You will need `curl`, `keytool` and `openssl`)

```
$ curl https://raw.githubusercontent.com/hashgraph/full-stack-testing/main/solo/test/scripts/gen-legacy-keys.sh -o gen-legacy-keys.sh
$ chmod +x gen-legacy-keys.sh
$ ./gen-legacy-keys.sh node0,node1,node2

# view the list of generated keys in the cache folder
$ ls ~/.solo/cache/keys                                                                    
hedera-node0.crt  hedera-node1.crt  hedera-node2.crt  private-node0.pfx private-node2.pfx
hedera-node0.key  hedera-node1.key  hedera-node2.key  private-node1.pfx public.pfx

```

* Setup cluster with shared components (by default it is installed in the `default` namespace)

```
$ solo cluster setup

******************************* Solo *********************************************
Version                 : 0.19.1
Kubernetes Context      : kind-solo
Kubernetes Cluster      : kind-solo
Kubernetes Namespace    : solo
**********************************************************************************
✔ Initialize
✔ Prepare chart values
✔ Install 'fullstack-cluster-setup' chart [1s]

```

In a separate terminal, you may run `k9s` to view the pod status.

* Deploy helm chart with Hedera network components
  * It may take a while (5~15 minutes depending on your internet speed) to download various docker images and get the pods started.
  * If it fails, ensure you have enough resources allocated for Docker and restart.

```
$ solo network deploy

******************************* Solo *********************************************
Version                 : 0.19.1
Kubernetes Context      : kind-solo
Kubernetes Cluster      : kind-solo
Kubernetes Namespace    : solo
**********************************************************************************
(node:76336) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
✔ Initialize
✔ Install chart 'fullstack-deployment' [3s]
✔ Waiting for network pods to be ready [8m54s]
  ✔ Node: node0 (Pod: network-node0-0) [8m54s]
  ✔ Node: node1 (Pod: network-node1-0)
  ✔ Node: node2 (Pod: network-node2-0)

```

* Setup node with Hedera platform software.
  * It may take a while as it download the hedera platform code from <https://builds.hedera.com/>

```
$ solo node setup

******************************* Solo *********************************************
Version                 : 0.19.1
Kubernetes Context      : kind-solo
Kubernetes Cluster      : kind-solo
Kubernetes Namespace    : solo
**********************************************************************************
(node:78205) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
✔ Initialize
✔ Identify network pods
  ✔ Check network pod: node0
  ✔ Check network pod: node1
  ✔ Check network pod: node2
✔ Fetch platform software
↓ Generate Gossip keys
↓ Generate gRPC TLS keys
✔ Prepare staging directory
  ✔ Copy default files and templates
  ✔ Copy Gossip keys to staging
  ✔ Copy gRPC TLS keys to staging
  ✔ Prepare config.txt for the network
✔ Upload platform software into network nodes [5s]
  ✔ Node: node0 [1s]
  ✔ Node: node1 [1s]
  ✔ Node: node2 [1s]
✔ Setup network nodes [1s]
  ✔ Node: node0 [1s]
    ✔ Copy Gossip keys [0.3s]
    ✔ Copy TLS keys [0.3s]
    ✔ Copy configuration files [0.8s]
    ✔ Set file permissions
  ✔ Node: node1 [1s]
    ✔ Copy Gossip keys [0.2s]
    ✔ Copy TLS keys [0.3s]
    ✔ Copy configuration files [0.8s]
    ✔ Set file permissions [0.1s]
  ✔ Node: node2 [1s]
    ✔ Copy Gossip keys [0.2s]
    ✔ Copy TLS keys [0.3s]
    ✔ Copy configuration files [0.8s]
    ✔ Set file permissions [0.1s]

```

* Start the nodes

```
$ solo node start

******************************* Solo *********************************************
Version                 : 0.19.1
Kubernetes Context      : kind-solo
Kubernetes Cluster      : kind-solo
Kubernetes Namespace    : solo
**********************************************************************************
✔ Initialize
✔ Identify network pods
  ✔ Check network pod: node0
  ✔ Check network pod: node1
  ✔ Check network pod: node2
✔ Starting nodes
  ✔ Start node: node0
  ✔ Start node: node1
  ✔ Start node: node2
✔ Check nodes are ACTIVE [23s]
  ✔ Check node: node0 [23s]
  ✔ Check node: node1 [0.1s]
  ✔ Check node: node2 [0.1s]

```

You may view the list of pods using `k9s` as below:

```
 Context: kind-solo                                <0> all       <a>      Attach     <l>       Logs               ____  __.________
 Cluster: kind-solo                                <1> default   <ctrl-d> Delete     <p>       Logs Previous     |    |/ _/   __   \______
 User:    kind-solo                                              <d>      Describe   <shift-f> Port-Forward      |      < \____    /  ___/
 K9s Rev: v0.27.4 ⚡️v0.31.7                                      <e>      Edit       <s>       Shell             |    |  \   /    /\___ \
 K8s Rev: v1.27.3                                                <?>      Help       <n>       Show Node         |____|__ \ /____//____  >
 CPU:     n/a                                                    <ctrl-k> Kill       <f>       Show PortForward          \/            \/
 MEM:     n/a
┌───────────────────────────────────────────────────────────── Pods(all)[27] ─────────────────────────────────────────────────────────────┐
│ NAMESPACE↑          NAME                                                   PF READY RESTARTS STATUS   IP           NODE                 │
│ default             console-557956d575-4tph9                               ●  1/1          0 Running  10.244.0.6   solo-control-plane   │
│ default             minio-operator-7d575c5f84-mkk8t                        ●  1/1          0 Running  10.244.0.5   solo-control-plane   │
│ kube-system         coredns-5d78c9869d-8x4zm                               ●  1/1          0 Running  10.244.0.4   solo-control-plane   │
│ kube-system         coredns-5d78c9869d-64lm6                               ●  1/1          0 Running  10.244.0.3   solo-control-plane   │
│ kube-system         etcd-solo-control-plane                                ●  1/1          0 Running  172.18.0.2   solo-control-plane   │
│ kube-system         kindnet-6cng4                                          ●  1/1          0 Running  172.18.0.2   solo-control-plane   │
│ kube-system         kube-apiserver-solo-control-plane                      ●  1/1          0 Running  172.18.0.2   solo-control-plane   │
│ kube-system         kube-controller-manager-solo-control-plane             ●  1/1          0 Running  172.18.0.2   solo-control-plane   │
│ kube-system         kube-proxy-sg88w                                       ●  1/1          0 Running  172.18.0.2   solo-control-plane   │
│ kube-system         kube-scheduler-solo-control-plane                      ●  1/1          0 Running  172.18.0.2   solo-control-plane   │
│ local-path-storage  local-path-provisioner-6bc4bddd6b-7cv7c                ●  1/1          0 Running  10.244.0.2   solo-control-plane   │
│ solo                envoy-proxy-node0-84947f844f-jn95h                     ●  1/1          0 Running  10.244.0.8   solo-control-plane   │
│ solo                envoy-proxy-node1-65f8879dcc-8jnn8                     ●  1/1          0 Running  10.244.0.7   solo-control-plane   │
│ solo                envoy-proxy-node2-667f848689-5hnrv                     ●  1/1          0 Running  10.244.0.13  solo-control-plane   │
│ solo                fullstack-deployment-grpc-69f9cc5666-kjvbn             ●  1/1          0 Running  10.244.0.9   solo-control-plane   │
│ solo                fullstack-deployment-hedera-explorer-79f79b7df4-xk79b  ●  1/1          0 Running  10.244.0.20  solo-control-plane   │
│ solo                fullstack-deployment-importer-6bb8547f5b-5drzc         ●  1/1          0 Running  10.244.0.11  solo-control-plane   │
│ solo                fullstack-deployment-postgres-postgresql-0             ●  1/1          0 Running  10.244.0.22  solo-control-plane   │
│ solo                fullstack-deployment-rest-584f5cb6bb-6vr55             ●  1/1          0 Running  10.244.0.18  solo-control-plane   │
│ solo                fullstack-deployment-web3-69dcdfc4fb-7vxmg             ●  1/1          0 Running  10.244.0.21  solo-control-plane   │
│ solo                haproxy-node0-96f8df6d-74xws                           ●  1/1          0 Running  10.244.0.12  solo-control-plane   │
│ solo                haproxy-node1-845fb68f48-49w82                         ●  1/1          0 Running  10.244.0.19  solo-control-plane   │
│ solo                haproxy-node2-867656ff6-fm8sk                          ●  1/1          0 Running  10.244.0.10  solo-control-plane   │
│ solo                minio-pool-1-0                                         ●  2/2          0 Running  10.244.0.24  solo-control-plane   │
│ solo                network-node0-0                                        ●  6/6          0 Running  10.244.0.14  solo-control-plane   │
│ solo                network-node1-0                                        ●  6/6          0 Running  10.244.0.16  solo-control-plane   │
│ solo                network-node2-0                                        ●  6/6          0 Running  10.244.0.15  solo-control-plane   │
│
```

### Access Hedera Network services

Once the nodes are up, you may now expose various services (using `k9s` (shift-f) or `kubectl port-forward`) and access. Below are most used services that you may expose.

* Node services: Prefix `network-<node ID>-svc`
* HAProxy: `haproxy-<node ID>-svc`
* EnvoyProxy: `envoy-proxy-<node ID>-svc`
* Hedera explorer: `fullstack-deployment-hedera-explorer`

```
┌─────────────────────────────────────────────────────────── Services(all)[24] ───────────────────────────────────────────────────────────┐
│ NAMESPACE↑   NAME                                               TYPE          CLUSTER-IP     EXTERNAL-IP PORTS                          │
│ default      console                                            ClusterIP     10.96.79.124               http:9090►0 https:9443►0       │
│ default      kubernetes                                         ClusterIP     10.96.0.1                  https:443►0                    │
│ default      operator                                           ClusterIP     10.96.110.186              http:4221►0                    │
│ default      sts                                                ClusterIP     10.96.124.200              https:4223►0                   │
│ kube-system  kube-dns                                           ClusterIP     10.96.0.10                 dns:53►0╱UDP dns-tcp:53►0 metr │
│ solo         envoy-proxy-node0-svc                              ClusterIP     10.96.57.87                hedera-grpc-web:8080►0 prometh │
│ solo         envoy-proxy-node1-svc                              ClusterIP     10.96.218.190              hedera-grpc-web:8080►0 prometh │
│ solo         envoy-proxy-node2-svc                              ClusterIP     10.96.37.121               hedera-grpc-web:8080►0 prometh │
│ solo         fullstack-deployment-grpc                          ClusterIP     10.96.194.119              grpc:5600►0 http:80►0          │
│ solo         fullstack-deployment-hedera-explorer               ClusterIP     10.96.101.44               http:80►0                      │
│ solo         fullstack-deployment-postgres-pgpool               ClusterIP     10.96.87.117               postgresql:5432►0              │
│ solo         fullstack-deployment-postgres-postgresql           ClusterIP     10.96.45.88                postgresql:5432►0              │
│ solo         fullstack-deployment-postgres-postgresql-headless  ClusterIP                                postgresql:5432►0              │
│ solo         fullstack-deployment-rest                          ClusterIP     10.96.209.246              http:80►0                      │
│ solo         fullstack-deployment-web3                          ClusterIP     10.96.218.212              http:80►0                      │
│ solo         haproxy-node0-svc                                  LoadBalancer  10.96.231.160  <pending>   non-tls-grpc-client-port:50211 │
│ solo         haproxy-node1-svc                                  LoadBalancer  10.96.24.61    <pending>   non-tls-grpc-client-port:50211 │
│ solo         haproxy-node2-svc                                  LoadBalancer  10.96.186.144  <pending>   non-tls-grpc-client-port:50211 │
│ solo         minio                                              ClusterIP     10.96.112.217              http-minio:80►0                │
│ solo         minio-console                                      ClusterIP     10.96.245.34               http-console:9090►0            │
│ solo         minio-hl                                           ClusterIP                                http-minio:9000►0              │
│ solo         network-node0-svc                                  ClusterIP     10.96.111.149              gossip:50111►0 grpc-non-tls:50 │
│ solo         network-node1-svc                                  ClusterIP     10.96.26.218               gossip:50111►0 grpc-non-tls:50 │
│ solo         network-node2-svc                                  ClusterIP     10.96.114.167              gossip:50111►0 grpc-non-tls:50 │
 
```

## Example - 2: Deploy a private Hedera network (version `0.47.0-alpha.0`)

* Initialize `solo` with tag `v0.47.0-alpha.0` and list of node names `node0,node1,node2`:

```
$ solo init -t v0.47.0-alpha.0 -i node0,node1,node2 -n "${SOLO_NAMESPACE}" 

# output is similar as example-1 
```

* Generate `pem` node keys for default node IDs: node0,node1,node2

```
solo node keys --gossip-keys --tls-keys --key-format pem -i node0,node1,node2

******************************* Solo *********************************************
Version                 : 0.19.1
Kubernetes Context      : kind-solo
Kubernetes Cluster      : kind-solo
Kubernetes Namespace    : solo
**********************************************************************************
✔ Initialize
✔ Generate gossip keys
✔ Generate gRPC TLS keys

$ ls ~/.solo/cache/keys  
a-private-node0.pem a-public-node0.pem  hedera-node0.crt    hedera-node1.key    private-node0.pfx   public.pfx          s-private-node2.pem s-public-node2.pem
a-private-node1.pem a-public-node1.pem  hedera-node0.key    hedera-node2.crt    private-node1.pfx   s-private-node0.pem s-public-node0.pem
a-private-node2.pem a-public-node2.pem  hedera-node1.crt    hedera-node2.key    private-node2.pfx   s-private-node1.pem s-public-node1.pem



```

* Setup cluster with shared components (by default it is installed in the `default` namespace)

```
$ solo cluster setup

# output is similar to example-1 
```

In a separate terminal, you may run `k9s` to view the pod status.

* Deploy helm chart with Hedera network components

```
$ solo network deploy

# output is similar to example-1 
```

* Setup node with Hedera platform.
  * It may take a while (~10 minutes depending on your internet speed) to download various docker images and get the
    pods started.

```
$ solo node setup

# output is similar to example-1 
```

* Start the nodes

```
$ solo node start

# output is similar to example-1 
```
