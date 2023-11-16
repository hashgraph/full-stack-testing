# fullstack-network-manager CLI

fullstack-network-manager is a CLI tool to manage and deploy a Hedera Network using Helm chart for local testing.

## Install

* Create or update `~/.npmrc` file and specify the GitHub package registry: `@hashgraph:registry=https://npm.pkg.github.com`

```
❯ cat ~/.npmrc
@hashgraph:registry=https://npm.pkg.github.com
```

* Run `npm install -g @hedera/fullstack-network-manager`

* Run `fsnetman` from a terminal as shown below

```
❯ fsnetman
Usage:
  fsnetman <command> [options]

Commands:
  fsnetman init     Perform dependency checks and initialize local environment
  fsnetman cluster  Manage FST cluster
  fsnetman chart    Manage FST chart deployment

Options:
  -h, --help     Show help                                                                                     [boolean]
  -v, --version  Show version number                                                                           [boolean]

Select a command
```

## Develop

* In order to support ES6 modules with `jest`, set an env variable `export NODE_OPTIONS=--experimental-vm-modules >> ~/.zshrc`
  * If you are using Intellij and would like to use debugger tools, you will need to enable `--experimental-vm-modules` for `Jest`.
    * `Run->Edit Configurations->Edit Configuration Templates->Jest` and then set `--experimental-vm-modules` in `Node Options`.
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

* In order to run E2E test, we need to setup cluster and install the chart.

```
  fsnetman init -d ../charts # use the charts directory
  fsnetman cluster create
  fsnetman cluster setup
  fsnetman chart install
  sleep 5 # optional
  npm run test-e2e 
```
