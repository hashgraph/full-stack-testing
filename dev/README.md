# Local Development
Below are few helper commands to start the hedera network in the local kubernetes cluster:

- `make setup`: sets up .env file with default settings. Edit this file with any desired settings.
- `make setup-cluster`: sets up a kind cluster. It assumes docker desktop is running with enough resources (6 core, 8Gb RAM, 100G disk)
- `make deploy-network`: deploys fullstack-deployment helm chart and runs helm tests to ensure deployment was successful.
- `make start`: uses NMT to install platform in the network-node pods and starts the node.
- `make stop`: uses NMT to stop nodes.
- `make destroy-network`: uninstalls the helm chart
- `make reset`: destroy the network, setup and start all nodes
## Prerequisite
Some resources are stored in the bucket(SwirldsRegression org): `fst-resources`. 
You will need access to it and have `gsutil` installed locally

## Typical workflow

### Start node:
  - `make setup setup-cluster`: setup cluster
  - `make deploy-network setup-nodes`: deploy the helm chart
  - `make start-nodes`: install and start the network node using NMT

After this the network is ready for use.

### Stop node:
- `make stop-nodes`: stop the node and delete the network

### Reset network:
- `make reset`: destroys the network, deploys a new network and start nodes
