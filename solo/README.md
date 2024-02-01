# Solo

An opinionated CLI tool to deploy and manage private Hedera Networks.

## Requirements

* Node(^18.19.0)
* Helm(^3.14.0)
* Kubectl(^1.28.2)

## Setup

* Install [Node](https://nodejs.org/en/download). You may also use [nvm](https://github.com/nvm-sh/nvm) to manage different Node versions locally
* Install [kubectl](https://kubernetes.io/docs/tasks/tools/)
* Install [helm](https://helm.sh/docs/intro/install/)
* Useful tools (Optional)
  * Install [kind](https://kind.sigs.k8s.io/)
  * Install [k9s](https://k9scli.io/)
  * Install [kubectx](https://github.com/ahmetb/kubectx)

## Install Solo

* Run `npm install -g @hashgraph/solo`

## Setup Kubernetes cluster

* If you don't already have a cluster, you may use [kind](https://kind.sigs.k8s.io/) and
  [kubectl](https://kubernetes.io/docs/tasks/tools/) to create a cluster and namespace as below:

```
export SOLO_CLUSTER_NAME=solo
export SOLO_NAMESPACE=solo
kind create cluster -n "${SOLO_CLUSTER_NAME}" 
kubectl create ns "${SOLO_NAMESPACE}" 
```

## Generate Node Keys

### Standard keys (.pem file)

These keys are supported by Hedera platform >=`0.47.0-alpha.0`.
You may run `solo node keys --gossip-keys --tls-keys --key-format pem -i node0,node1,node2` command to generate the required node keys.

### Legacy keys (.pfx file)

All Hedera platform version supports the legacy `.pfx` formatted key files.

Unfortunately `solo` is not able to generate legacy `PFX` formatted keys. However, if `curl`, `keytool` and `openssl`
are installed, you may run the following command to generate the pfx formatted gossip keys in the default
cache directory (`$HOME/.solo/cache/keys`):

```
# Option - 1: Generate keys for default node IDs: node0,node1,node2,node3
/bin/bash -c "$(curl -fsSL  https://raw.githubusercontent.com/hashgraph/full-stack-testing/main/solo/test/scripts/gen-legacy-keys.sh)"

# Option - 2: Generate keys for custom node IDs
curl https://raw.githubusercontent.com/hashgraph/full-stack-testing/main/solo/test/scripts/gen-legacy-keys.sh -o gen-legacy-keys.sh
chmod +x gen-legacy-keys.sh
./gen-legacy-keys.sh alice,bob,carol
```

# Example

## Deploy a private Hedera network (version `0.42.5`)

* Generate `pfx` node keys for default node IDs: node0,node1,node2,node3

```
/bin/bash -c "$(curl -fsSL  https://raw.githubusercontent.com/hashgraph/full-stack-testing/main/solo/test/scripts/gen-legacy-keys.sh)"
```

* Initialize `solo`

```
solo init -t 0.42.5 # cache args for subsequent commands
```

* Setup cluster with shared components in the `default` namespace

```
solo cluster setup -n default 
```

In a separate terminal, you may run `k9s` to view the pod status.

* Deploy helm chart with Hedera network components

```
solo network deploy -n "${SOLO_NAMESPACE}" 
```

* Setup node with Hedera platform. It may take a while (~10 minutes depending on your internet speed) to download
  various docker images and get the pods started.

```
solo node setup

```

* Start the nodes

```
solo node start
```
