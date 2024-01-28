# Full Stack Network Manager CLI

Full Stack Network Manager (fsnetman) is a CLI tool to manage and deploy a Hedera Network using the FS Helm Charts.

## Install

* Create or update `~/.npmrc` file and specify the GitHub package registry:

```
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
@hashgraph:registry=https://npm.pkg.github.com
```

* Get
  your [Github access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
  and setup an environment variable GITHUB\_TOKEN.

* Run `npm install -g @hashgraph/fullstack-network-manager`

* Ensure you have a valid kubernetes context, cluster and namespace. You may use `kind` and `kubectl` CLIs to create
  cluster and namespace as below (See [`test/e2e/setup-e2e.sh`](test/e2e/setup_e2e.sh)):

```
export FST_CLUSTER_NAME=fst-local
export FST_NAMESPACE=fst-local
kind create cluster -n "${FST_CLUSTER_NAME}" 
kubectl create ns "${FST_NAMESPACE}"
fsnetman init -d ../charts --namespace "${FST_NAMESPACE}" # cache args for subsequent commands
```

* Run `fsnetman` from a terminal, It may show usage options as shown below:

```
❯ fsnetman

-------------------------------------------------------------------------------
*** Fullstack Network Manager (FsNetMan) ***
Version                 : 0.16.0
Kubernetes Context      : kind-fst-local
Kubernetes Cluster      : kind-fst-local
-------------------------------------------------------------------------------

Usage:
  fsnetman <command> [options]

Commands:
  fsnetman init     Perform dependency checks and initialize local environment
  fsnetman cluster  Manage cluster
  fsnetman chart    Manage chart deployment
  fsnetman node     Manage a node running Hedera platform
  fsnetman relay    Manage JSON RPC relays

Options:
      --dev      Enable developer mode                                                        [boolean] [default: false]
  -h, --help     Show help                                                                                     [boolean]
  -v, --version  Show version number                                                                           [boolean]

Select a command
```

## Develop

* In order to support ES6 modules with `jest`, set an env
  variable `export NODE_OPTIONS=--experimental-vm-modules >> ~/.zshrc`
  * If you are using Intellij and would like to use debugger tools, you will need to
    enable `--experimental-vm-modules` for `Jest`.
    * `Run->Edit Configurations->Edit Configuration Templates->Jest` and then set `--experimental-vm-modules`
      in `Node Options`.
* Run `npm i` to install the required packages
* Run `npm link` to install `fsnetman` as the CLI
  * Note: you need to do it once. If `fsnetman` already exists in your path, you will need to remove it first.
  * Alternative way would be to run `npm run fsnetman -- <COMMAND> <ARGS>`
* Run `npm test` or `npm run test` to run the unit tests
* Run `fsnetman` to access the CLI as shown above.
* Note that debug logs are stored at `~/.fsnetman/logs/fst.log`. So you may use `tail -f ~/.fsnetman/logs/fst.log | jq
  ` in a separate terminal to keep an eye on the logs.
* Before making a commit run `npm run format`

## E2E tests

* In order to run E2E test, we need to set up cluster and install the chart.
  * Run `./test/e2e/setup-e2e.sh`
  * Run `npm run test-e2e`
