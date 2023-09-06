# Gateway API
This folder includes scripts and files to debug Gateway API.

## Manual Test
- Deploy `fst` Gateway
    - `make deploy-fst-gateway`
- Test HTTPRoute
    - ` make test-gateway-http-route` and check for below line
  ```
  ********************************************************
  SUCCESS: HTTPRoute debug.fst.local:8080
  ********************************************************
  ```
- Test TCPRoute
    - ` make test-gateway-tcp-route` and check for below line
  ```
  ********************************************************
  SUCCESS: TCPRoute localhost:9000
  ********************************************************
  ```
- Test GRPCRoute
    - ` make test-gateway-grpc-route` and check for below line
  ```
  ********************************************************
  SUCCESS: GRPCRoute debug.fst.local:9090
  ********************************************************
  ```
- Delete `fst` Gateway
    - `make destroy-fst-gateway`
