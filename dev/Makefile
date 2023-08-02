SHELL=/bin/bash
SCRIPTS_DIR=$(PWD)/scripts
CHART_DIR=$(PWD)/../charts/hedera-network
SCRIPT_NAME=direct-install.sh

TMP_DIR=${SCRIPTS_DIR}/../temp

.PHONY: all
all: setup setup-cluster reset

.PHONY: setup
setup:
	@rm -f "${TMP_DIR}/"*.*
	@cp "${SCRIPTS_DIR}/template.env" "${TMP_DIR}/.env"

.PHONY: setup-cluster
setup-cluster:
	@kind create cluster -n fst

.PHONY: deploy-chart
deploy-chart:
	@echo ">> Deploying helm chart..." && \
	echo "" && \
	if [ "${SCRIPT_NAME}" = "nmt-install.sh" ]; then \
		helm install fst ../charts/hedera-network --set defaults.root.image.repository=hashgraph/full-stack-testing/ubi8-init-dind ; \
	else \
		helm install fst ../charts/hedera-network ; \
	fi \

.PHONY: helm-test
helm-test: setup deploy-chart
	@echo "" && \
	echo ">> Running helm test..." && \
	echo "" && \
	helm test fst --logs

.PHONY: deploy-network
deploy-network: deploy-chart
	@echo "" && \
	echo ">> Pod Information...." && \
	echo "" && \
	kubectl get pods -o wide && \
	echo "" && \
    echo ">> Service Information...." && \
    echo "" && \
	kubectl get svc -o wide

.PHONY: destroy-test-container
destroy-test-container:
	@echo "" && \
	echo ">> Deleting test container..." && \
	kubectl delete pod network-test || true

.PHONY: destroy-network
destroy-network: destroy-test-container
	@echo "" && \
	echo ">> Uninstalling helm chart..." && \
 	helm uninstall fst && \
 	sleep 10

.PHONY: test
test: deploy-network setup-nodes start-nodes helm-test destroy-network

.PHONY: setup-nodes
setup-nodes: setup
	source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && setup_node_all

.PHONY: start-nodes
start-nodes:
	source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && start_node_all

.PHONY: verify-nodes
verify-nodes:
	source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && verify_node_all

.PHONY: stop-nodes
stop-nodes:
	source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && stop_node_all

.PHONY: reset-nodes
reset-nodes:
	source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && reset_node_all

.PHONY: gen-keys
gen-keys:
	"${SCRIPTS_DIR}./demo-keys/gen-public-pfx.sh"  node0 node1 node2 node3

.PHONY: restart
restart: stop-nodes destroy-network deploy-network start-nodes

.PHONY: prep-address-book
prep-address-book:
	source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && prep_address_book

.PHONY: run-func
run-func:
	source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && ${FUNC}

.PHONY: start
start: deploy-network setup-nodes start-nodes

.PHONY: restart
restart: stop-nodes start-nodes

.PHONY: reset
reset: destroy-network start

