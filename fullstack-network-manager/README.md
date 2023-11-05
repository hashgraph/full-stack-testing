# fullstack-network-manager CLI

fullstack-network-manager is a CLI tool to manage and deploy a Hedera Network using Helm chart for local testing.

## Install
- Create or update `~/.npmrc` file and specify the Github package registry: `@hashgraph:registry=https://npm.pkg.github.com`
```
❯ cat ~/.npmrc
@hashgraph:registry=https://npm.pkg.github.com
```
- Run `npm install -g @hedera/fullstack-network-manager`

- Run `fsnetman` from a terminal as shown below
``` 
❯ fsnetman
Usage: fsnetman <command> [options]

Commands:
  fsnetman init     Initialize local environment
  fsnetman cluster  Manager FST cluster

Options:
  -h, --help     Show help                                             [boolean]
  -v, --version  Show version number                                   [boolean]

Select a command
```
## Develop
- In order to support ES6 modules with `jest`, set an env variable `export NODE_OPTIONS=--experimental-vm-modules >> ~/.zshrc`
  - If you are using Intellij and would like to use debugger tools, you will need to enable `--experimental-vm-modules` for `Jest`.
    - `Run->Edit Configurations->Edit Configuration Templates->Jest` and then set `--experimental-vm-modules` in `Node Options`.
- Run `npm i` to install the required packages
- Run `npm link` to install `fsnetman` as the CLI (you need to do it once)
- Run `npm test` or `npm run test` to run the unit tests
- Run `npm run test-e2e` to run the long-running integration tests
- Run `npm run fsnetman` to access the CLI as shown below:
```
❯ npm run fsnetman
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

