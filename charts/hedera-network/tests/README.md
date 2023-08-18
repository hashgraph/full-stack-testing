# Helm Chart Tests
This directory contains the BATS tests for helm chart. 

`run.sh` is the entrypoint to execute the tests locally assuming
you have the network deployed already.

## Development
- Use the `test_basic_deployment.bats` file as the template while creating new tests.

## Run
- Run `git submodule update --init` in order to install [bats](https://github.com/bats-core) for tests. 
- Create a .env file in this directory from the `env.template` file
- From `dev` folder run `make deploy-network`
- Once network is deployed, you can run `./run.sh` to run the tests.
- When tests are working, then redeploy and run the helm tests: `make destroy-network deploy-network helm-test`

## Notes
- Any new template variables should be added in `helpers.sh` with prefix `TMPL_` (e.g TMPL_TOTAL_NODES)  
- Any new required env variable should be added in `env.sh`
- Any new helper function should be added in `helpers.sh`
- If a new script file is added, load it in `load.sh`