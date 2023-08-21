# Force the use of bash as the shell for more features
SHELL=/bin/bash

# Ensure we can catch error to run cleanup when multiple make commands are run in sequence.
# Here we tell make to run all scripts as one-shell and also set 'pipefail' and 'errexit' flags.
# https://stackoverflow.com/questions/28597794/how-can-i-clean-up-after-an-error-in-a-makefile
SHELLOPTS:=$(if $(SHELLOPTS),$(SHELLOPTS):)pipefail:errexit
.ONESHELL:

# Here we tell make not to output the actual command before execution in order to reduce noise in the logs.
.SILENT: setup setup-cluster deploy-chart helm-test deploy-network  destroy-test-container destroy-network test

# Setup variables
SCRIPTS_DIR=$(PWD)/scripts
CHART_DIR=$(PWD)/../charts/hedera-network
SCRIPT_NAME=direct-install.sh
TMP_DIR=${SCRIPTS_DIR}/../temp

.PHONY: all
all: setup setup-cluster reset

.PHONY: setup
setup:
	rm -f "${TMP_DIR}/"*.*
	cp "${SCRIPTS_DIR}/template.env" "${TMP_DIR}/.env"

.PHONY: setup-cluster
setup-cluster:
	kind create cluster -n fst

.PHONY: update-helm-dependencies
update-helm-dependencies:
	helm dependency update ../charts/hedera-network

.PHONY: deploy-chart
deploy-chart:
	echo ">> Deploying helm chart..." && \
	echo "" && \
	if [ "${SCRIPT_NAME}" = "nmt-install.sh" ]; then \
		helm install fst ../charts/hedera-network --set defaults.root.image.repository=hashgraph/full-stack-testing/ubi8-init-dind ; \
	else \
		helm install fst ../charts/hedera-network ; \
	fi \

.PHONY: helm-test
helm-test:
	echo "" && \
	echo ">> Running helm test..." && \
	echo "" && \
	# We have to specify the specific test name here, otherwise it executes all tests from the subcharts as well.
	helm test fst --logs --filter 'name=network-test'

.PHONY: deploy-network
deploy-network: deploy-chart
	echo "" && \
	echo ">> Pod Information...." && \
	echo "" && \
	kubectl get pods -o wide && \
	echo "" && \
    echo ">> Service Information...." && \
    echo "" && \
	kubectl get svc -o wide

.PHONY: destroy-test-container
destroy-test-container:
	echo "" && \
	echo ">> Deleting test container..." && \
	kubectl delete pod network-test || true

.PHONY: destroy-network
destroy-network: destroy-test-container
	echo "" && \
	echo ">> Uninstalling helm chart..." && \
 	helm uninstall fst && \
 	sleep 10

.PHONY: test
test:
	# Enable cleanup_test function so that even if test fails, we cleanup the cluster.
	# We are only enabling this in this make target, however if necessary, similar pattern can be used in other targets.
	# Ref: https://stackoverflow.com/questions/28597794/how-can-i-clean-up-after-an-error-in-a-makefile
	function cleanup_test {
		$(MAKE) destroy-network
	}
	trap cleanup_test EXIT # always destroy-network on exit
	$(MAKE) setup deploy-minio-operator-if-required update-helm-dependencies deploy-network helm-test setup-nodes start-nodes

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
start: deploy-minio-operator-if-required update-helm-dependencies deploy-network setup-nodes start-nodes

.PHONY: restart
restart: stop-nodes start-nodes

.PHONY: reset
reset: destroy-network start

.PHONY: deploy-minio-operator
deploy-minio-operator:
	@echo ">> Deploying minio operator..."; \
	helm install --repo https://operator.min.io/ --namespace=minio-operator --create-namespace --version 5.0.7 minio-operator operator && \
	echo ">> Waiting for minio operator to be ready..." && \
	kubectl --namespace=minio-operator  wait --for=condition=available --timeout=600s deployment.apps/minio-operator && \
	sleep 5

.PHONY: is-minio-operator-installed
is-minio-operator-installed:
	@echo ">> Checking for minio operator..."; \
	helm list --namespace=minio-operator | grep minio-operator &> /dev/null && { echo "Found minio operator."; exit 0; }; \
	echo "Minio operator not found."; exit 1

.PHONY: deploy-minio-operator-if-required
deploy-minio-operator-if-required:
	@$(MAKE) is-minio-operator-installed || $(MAKE) deploy-minio-operator


.PHONY: undeploy-minio-operator
undeploy-minio-operator:
	echo ">> Deploying minio operator..." && \
	helm delete  --namespace=minio-operator minio-operator
