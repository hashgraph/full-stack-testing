# Solo

An opinionated CLI tool to deploy and manage private Hedera Networks.

## Requirements

* Node(^18.19.0)
* Helm(^3.14.0)
* Kubectl(^1.28.2)
* Helpful tools (Optional):
  * [`k9s`](https://k9scli.io/)
  * [`kubectx`](https://github.com/ahmetb/kubectx)

## Install

* Run `npm install -g @hashgraph/solo`

* Ensure you have a valid kubernetes context, cluster and namespace. You may use `kind` and `kubectl` CLIs to create
  cluster and namespace as below:

```
export SOLO_NAMESPACE=solo # use a namespace that suits you
kind create cluster
kubectl create ns "${SOLO_NAMESPACE}" 
```

* Run `solo` from a terminal, It may show usage options as shown below:

```
❯ solo

******************************* Solo *********************************************
Version                 : 0.18.0
Kubernetes Context      : kind-kind
Kubernetes Cluster      : kind-kind
Kubernetes Namespace    : undefined
**********************************************************************************
Usage:
  solo <command> [options]

Commands:
  solo init     Initialize local environment
  solo cluster  Manage fullstack testing cluster
  solo network  Manage fullstack testing network deployment
  solo node     Manage Hedera platform node in fullstack testing network
  solo relay    Manage JSON RPC relays in fullstack testing network

Options:
      --dev      Enable developer mode                                                        [boolean] [default: false]
  -h, --help     Show help                                                                                     [boolean]
  -v, --version  Show version number                                                                           [boolean]

Select a command
```

* Deploy private Hedera network in your existing cluster and namespace

```
solo init -n "${SOLO_NAMESPACE}" # cache args for subsequent commands
solo cluster setup
solo network deploy
solo node setup
solo node start
```

## Develop

* In order to support ES6 modules with `jest`, set an env
  variable `export NODE_OPTIONS=--experimental-vm-modules >> ~/.zshrc`
  * If you are using Intellij and would like to use debugger tools, you will need to
    enable `--experimental-vm-modules` for `Jest`.
    * `Run->Edit Configurations->Edit Configuration Templates->Jest` and then set `--experimental-vm-modules`
      in `Node Options`.
* Run `npm i` to install the required packages
* Run `npm link` to install `solo` as the CLI
  * Note: you need to do it once. If `solo` already exists in your path, you will need to remove it first.
  * Alternative way would be to run `npm run solo -- <COMMAND> <ARGS>`
* Run `npm test` or `npm run test` to run the unit tests
* Run `solo` to access the CLI as shown above.
* Note that debug logs are stored at `$HOME/.solo/logs/solo.log`. So you may use `tail -f $HOME/.solo/logs/solo.log | jq
  ` in a separate terminal to keep an eye on the logs.
* Before making a commit run `npm run format`

## E2E tests

* In order to run E2E test, we need to set up cluster and install the chart.
  * Run `./test/e2e/setup-e2e.sh`
  * Run `npm run test-e2e`

## Node Keys

### Standard keys (.pem file)

`solo` is able to generate standard `PEM` formatted keys for nodes. You may
run `solo node keys --gossip-keys --tls-keys`
command to generate the required keys.

### Legacy keys (.pfx file)

`solo` is not able to generate legacy `PFX` formatted gossip keys. However, you may use the
script [test/scripts/gen-legacy-keys](test/scripts/gen-legacy-keys.sh).
For example, if `curl`, `keytool` and `openssl` are installed on the machine, you may run the following command to
generate the pfx formatted gossip keys in the default
cache directory (`$HOME/.solo/cache/keys`):

```
# Option - 1: Generate keys for default node IDs: node0,node1,node2,node3
/bin/bash -c "${curl -fsSL  https://raw.githubusercontent.com/hashgraph/solo/main/test/scripts/gen-legacy-keys.sh)"

# Option - 2: Generate keys for custom node IDs
curl -o gen-legacy-keys.sh https://raw.githubusercontent.com/hashgraph/solo/main/test/scripts/gen-legacy-keys.sh
./legacy-key-generation.sh alice,bob,carol
```
