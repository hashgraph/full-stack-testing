# Solo

Solo is a CLI tool to manage and deploy a private Hedera Network.

## Install

* Create or update `~/.npmrc` file and specify the GitHub package registry:

```
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
@hashgraph:registry=https://npm.pkg.github.com
```

* Get
  your [Github access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
  and setup an environment variable GITHUB\_TOKEN.

* Run `npm install -g @hashgraph/solo`

* Ensure you have a valid kubernetes context, cluster and namespace. You may use `kind` and `kubectl` CLIs to create
  cluster and namespace as below (See [`test/e2e/setup-e2e.sh`](test/e2e/setup_e2e.sh)):

```
export SOLO_CLUSTER_NAME=solo-local
export SOLO_NAMESPACE=solo-local
kind create cluster -n "${SOLO_CLUSTER_NAME}" 
kubectl create ns "${SOLO_NAMESPACE}"
solo init -d ../charts --namespace "${SOLO_NAMESPACE}" # cache args for subsequent commands
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
* Note that debug logs are stored at `~/.solo/logs/solo.log`. So you may use `tail -f ~/.solo/logs/solo.log | jq
  ` in a separate terminal to keep an eye on the logs.
* Before making a commit run `npm run format`

## E2E tests

* In order to run E2E test, we need to set up cluster and install the chart.
  * Run `./test/e2e/setup-e2e.sh`
  * Run `npm run test-e2e`
