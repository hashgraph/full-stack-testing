# Helm Chart Tests
This directory contains the BATS tests for helm chart. 

`run.sh` is the entrypoint to execute the tests locally assuming
you have the network deployed already.

## Development
- Use the `test_basic_deployment.bats` file as the template while creating new tests.
- In order to run and debug the tests inside the helm test container, do the following:

    - Update `run` command section in `charts/hedera-network/template/tests/test-deployment.yaml` as below so that it keeps it running when we run `make helm-test`:
  ```
  - "/bin/bash"
  - "-c"
  #- "/tests/run.sh"
  - "while true;do echo sleeping for 60s; sleep 60;done" # keep the test container running so that we can debug issues 
  ```
  - once the `network-test` container is running, use another terminal to shell into it using command below
  ```
  kubectl exec -it "${RELEASE_NAME}-network-test" -- bash # where RELEASE_NAME is helm chart release name
  ```
  - Then you can run the test inside the container to debug 
  ```
  cd /tests && ./run.sh 
  ```
  - Once debug is done, you can exit and use Ctrl+C to terminate the helm-test process (you will need to delete the `network-test` container using `kubectl delete network-test`).
  - If it looks all good, revert changes in `charts/hedera-network/template/tests/test-deployment.yaml`

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