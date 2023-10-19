# fullstack-network-manager CLI

fullstack-network-manager is a CLI tool to manage and deploy a Hedera Network using Helm chart for local testing.

## Install
- Run `nmp -i hedera/fullstack-network-manager`
  - In order to install directly from this repository, run `npm link`
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