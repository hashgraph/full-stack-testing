# Setup Prometheus 
This folder contains helper files to setup a prometheus instance locally.

## Commands 
- Deploy prometheus operator 
    - `make deploy-prometheus-operator`
- Deploy prometheus
  - `make deploy-prometheus`
- Deploy prometheus example app
  - `make deploy-prometheus-example-app`
- Deploy all 
  `make deploy-all`
- Destroy all
  `make destroy-all`

## Manual Test
- From `dev` folder deploy the network `make deploy-network`
- From this folder run `make deploy-all`
- export prometheus svc port `kubectl port-forward svc/prometheus 9090:9090`
- browse `http://localhost:9090/tsdb-status` and ensure status are non-zero
