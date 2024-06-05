## Pre-requisites

Install `yq` from this link: [yq](https://github.com/mikefarah/yq/#install)

## Helm Chart Tests
This directory contains the BATS tests for helm chart. 

`run.sh` is the entrypoint to execute the tests locally assuming
you have the network deployed already.

## How to create and debug test
- Use the `test_basic_deployment.bats` file as the template while creating new tests.
- In order to run and debug the tests inside the helm test container, do the following:

    - Update `run` command section in `charts/fullstack-deployment/template/tests/test-deployment.yaml` as below so that it keeps it running when we run `make helm-test`:
  ```
  - "/bin/bash"
  - "-c"
  #- "/tests/run.sh"
  - "while true;do echo sleeping for 60s; sleep 60;done" # keep the test container running so that we can debug issues 
  ```
  - once the `network-test` container is running, use another terminal to shell into it using command below
  ```
  kubectl exec -it network-test -- bash 
  ```
  - Then you can run the test inside the container to debug 
  ```
  cd /tests && ./run.sh 
  ```
  - Once debug is done, you can exit and use Ctrl+C to terminate the helm-test process (you will need to delete the `network-test` container using `kubectl delete network-test`).
  - If it looks all good, revert changes in `charts/fullstack-deployment/template/tests/test-deployment.yaml`

## How to run the tests
- Goto folder `full-stack-testing/charts/fullstack-deployment/tests`
- Run `git submodule update --init` in order to install [bats](https://github.com/bats-core) for tests. 
- Create a .env file in this directory by copying from the `env.template` file
- From `full-stack-testing/dev` folder run the follow command `make setup setup-cluster deploy-network` to create cluster and deploy network.
- Once network is deployed, you can run `./run.sh` from `tests` directory to run the tests. It will create a log file under `logs` directory.
- When tests are working, then redeploy and run the helm tests: `make destroy-network deploy-network helm-test`

## Notes
- Any new template variables should be added in `helpers.sh` with prefix `TMPL_` (e.g TMPL_TOTAL_NODES)  
- Any new required env variable should be added in `env.sh`
- Any new helper function should be added in `helpers.sh`
- If a new script file is added, load it in `load.sh`
