SCRIPTS_DIR=$(PWD)/scripts

.PHONY: setup
setup:
	cp "${SCRIPTS_DIR}/template.env" ".env"

.PHONY: setup-cluster
setup-cluster:
	kind create cluster -n fst

.PHONY: deploy-chart
deploy-chart:
	@echo ">> Deploying helm chart..." && \
	helm install fst ../charts/hedera-network && \
 	echo ">> Waiting for network to be ready (timeout=300s)..." && \
  	kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l type=network-node --timeout=300s && \
 	echo ">> Running helm test..." && \
 	helm test fst &> deploy.log &

.PHONY: helm-test-logs
helm-test-logs:
	@kubectl wait --for=jsonpath='{.status.phase}'=Running pod/network-test --timeout=300s && \
	kubectl logs -f network-test

.PHONY: deploy-network
deploy-network: deploy-chart helm-test-logs

.PHONY: destroy-network
destroy-network:
	@echo ">> Uninstalling helm chart..." && helm uninstall fst && sleep 10

.PHONY: setup-nodes
setup-nodes:
	source "${SCRIPTS_DIR}/helper.sh" && setup_nodes

.PHONY: start-nodes
start-nodes:
	source "${SCRIPTS_DIR}/helper.sh" && start_nodes

.PHONY: verify-nodes
verify-nodes:
	source "${SCRIPTS_DIR}/helper.sh" && verify_nodes

.PHONY: stop-nodes
stop-nodes:
	source "${SCRIPTS_DIR}/helper.sh" && stop_nodes

.PHONY: gen-keys
gen-keys:
	"${SCRIPTS_DIR}./demo-keys/gen-public-pfx.sh"  node0 node1 node2 node3

.PHONY: restart
restart: stop-nodes destroy-network deploy-network start-nodes

.PHONY: prep-address-book
prep-address-book:
	source "${SCRIPTS_DIR}/helper.sh" && prep_address_book
