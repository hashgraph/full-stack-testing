# fullstack-network-manager CLI

fullstack-network-manager is a CLI tool to manage and deploy a Hedera Network using Helm chart for local testing.

## Develop
- In order to support ES6 modules with `jest`, set an env variable `export NODE_OPTIONS=--experimental-vm-modules >> ~/.zshrc`
  - If you are using Intellij and would like to use debugger tools, you will need to enable `--experimental-vm-modules` for `Jest`. 
    - `Run->Edit Configurations->Edit Configuration Templates->Jest` and then set `--experimental-vm-modules` in `Node Options`. 
- Run `npx jest` or `npm test` to run the tests
- Run `npm link` so that the CLI can be run using `fsnetman` in the terminal

## Install
- Run `nmp -i @hedera/fullstack-network-manager`
  - In order to install directly from this repository, run `npm link` from this directory.
- Once installed, the CLI will available as the following aliases:
    - `fsnetman`

## Command Examples

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