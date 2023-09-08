# Setup Telemetry
This folder contains helper files to setup a grafana, tempo and prometheus instances locally.


## Commands 
- Deploy prometheus
  - `make deploy-prometheus`
- Deploy prometheus example app
  - `make deploy-prometheus-example-app`
- Deploy grafana+tempo
  - `make deploy-grafana-tempo`
- Deploy tracing example 
  - `make deploy-tracing-example-app`

The reverse operations are prefixed with `destroy` (e.g. `destroy-grafana-tempo`)
  
## Manual Test
- From `dev` folder deploy the network `make deploy-network`.
- From this folder run `make deploy-all` to deploy the telemetry stack (grafana + tempo + prometheus ) along with example apps.
- Browse `http://localhost:9090/tsdb-status` and ensure "Head Stats" metrics status are non-zero.
- Browse `http://localhost:3000/explore` and ensure tracing are visible.
- Run `make destroy-all` to clean up telemetry stack and example apps.
