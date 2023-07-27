SCRIPTS_DIR=$(PWD)/scripts
TMP_DIR="${SCRIPTS_DIR}/../temp"

.PHONY: setup
setup:
	rm -f "${TMP_DIR}/*.*"
	cp "${SCRIPTS_DIR}/template.env" "${TMP_DIR}/.env"

.PHONY: setup-cluster
setup-cluster:
	kind create cluster -n fst

.PHONY: deploy-chart
deploy-chart:
	@echo ">> Deploying helm chart..." && \
	helm install fst ../charts/hedera-network && \
 	echo ">> Waiting for network to be ready (timeout=300s)..." && \
  	kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l fullstack.hedera.com/type=network-node --timeout=300s && \
 	echo ">> Running helm test..." && \
 	helm test fst &> "${TMP_DIR}/deploy.log" &

.PHONY: helm-test-logs
helm-test-logs:
	@kubectl wait --for=jsonpath='{.status.phase}'=Running pod/network-test --timeout=300s && \
	kubectl logs -f network-test

.PHONY: deploy-network
deploy-network: deploy-chart helm-test-logs
	kubectl get pods -o wide && \
	kubectl get svc -o wide

.PHONY: destroy-network
destroy-network:
	@echo ">> Uninstalling helm chart..." && helm uninstall fst && sleep 10

.PHONY: reset-network
reset-network: destroy-network deploy-network setup-nodes

.PHONY: setup-nodes
setup-nodes:
	source "${SCRIPTS_DIR}/helper.sh" && setup_node_all

.PHONY: start-nodes
start-nodes:
	source "${SCRIPTS_DIR}/helper.sh" && start_node_all

.PHONY: verify-nodes
verify-nodes:
	source "${SCRIPTS_DIR}/helper.sh" && verify_node_all

.PHONY: stop-nodes
stop-nodes:
	source "${SCRIPTS_DIR}/helper.sh" && stop_node_all

.PHONY: reset-nodes
reset-nodes:
	source "${SCRIPTS_DIR}/helper.sh" && reset_node_all

.PHONY: gen-keys
gen-keys:
	"${SCRIPTS_DIR}./demo-keys/gen-public-pfx.sh"  node0 node1 node2 node3

.PHONY: restart
restart: stop-nodes destroy-network deploy-network start-nodes

.PHONY: prep-address-book
prep-address-book:
	source "${SCRIPTS_DIR}/helper.sh" && prep_address_book

.PHONY: run-func
run-func:
	source "${SCRIPTS_DIR}/helper.sh" && ${FUNC}

