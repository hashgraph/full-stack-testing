# Local Development
Below are few helper commands to start the hedera network in the local kubernetes cluster:

- `make setup`: sets up .env file with default settings. Edit this file with any desired settings.
- `make setup-cluster`: sets up a kind cluster. It assumes docker desktop is running with enough resources (6 core, 8Gb RAM, 100G disk)
- `make deploy`: deploys hedera-network helm chart and runs helm tests to ensure deployment was successful.
- `make start`: uses NMT to install platform in the network-node pods and starts the node.
- `make stop`: uses NMT to stop nodes.
- `make destroy`: uninstalls the helm chart

## Typical workflow

### Start node:
  - `make setup setup-cluster`: setup cluster
  - `make deploy`: deploy the helm chart
  - `make start`: install and start the network node using NMT

After this the network is ready for use.

### Stop node:
- `make stop destroy`: stop the node and delete the network
