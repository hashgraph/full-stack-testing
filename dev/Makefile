# Force the use of bash as the shell for more features
SHELL=/bin/bash

# Ensure we can catch error to run cleanup when multiple make commands are run in sequence.
# Here we tell make to run all scripts as one-shell and also set 'pipefail' and 'errexit' flags.
# https://stackoverflow.com/questions/28597794/how-can-i-clean-up-after-an-error-in-a-makefile
SHELLOPTS:=$(if $(SHELLOPTS),$(SHELLOPTS):)pipefail:errexit
.ONESHELL:

# Here we tell make not to output the actual command before execution in order to reduce noise in the logs.
.SILENT: \
	setup \
	setup-cluster \
	deploy-chart \
	destroy-chart \
	helm-test \
	deploy-network  \
	destroy-network \
	destroy-test-container \
	deploy-all \
	destroy-all \
	local-kubectl-bats \
	ci-test

# Setup variables
CLUSTER_NAME ?="fst"
SCRIPTS_DIR=$(PWD)/scripts
CHART_DIR=$(PWD)/../charts/hedera-network
SCRIPT_NAME=direct-install.sh
TMP_DIR=${SCRIPTS_DIR}/../temp

CHART_VALUES_FILES= # extra values

# scripts
TELEMETRY_SCRIPT="telemetry.sh"
GATEWAY_API_SCRIPT="gateway.sh"
DOCKER_SCRIPT="docker.sh"

.PHONY: setup
setup:
	rm -f "${TMP_DIR}/"*.*
	cp "${SCRIPTS_DIR}/template.env" "${TMP_DIR}/.env"

.PHONY: setup-cluster
setup-cluster:
	echo "Cluster name: ${CLUSTER_NAME}" && \
	source "${SCRIPTS_DIR}/main.sh" && setup_cluster "${CLUSTER_NAME}"

.PHONY: destroy-cluster
destroy-cluster:
	kind delete cluster -n fst

.PHONY: install-chart
install-chart:
	source "${SCRIPTS_DIR}/main.sh" && install_chart "${SCRIPT_NAME}"

.PHONY: uninstall-chart
uninstall-chart:
	source "${SCRIPTS_DIR}/main.sh" && uninstall_chart

.PHONY: update-helm-dependencies
update-helm-dependencies:
	helm dependency update ../charts/hedera-network

.PHONY: deploy-chart
deploy-chart:
	$(MAKE) update-helm-dependencies
	$(MAKE) deploy-minio-operator-if-required
	$(MAKE)	deploy-prometheus-operator
	$(MAKE) deploy-gateway-api
	$(MAKE) install-chart

.PHONY: destroy-chart
destroy-chart:
	-$(MAKE) uninstall-chart
	-$(MAKE) destroy-gateway-api
	-$(MAKE) destroy-prometheus-operator
	-$(MAKE) undeploy-minio-operator

.PHONY: deploy-network
deploy-network: deploy-chart
	echo "" && \
    echo ">> Service Information...." && \
    echo "" && \
	kubectl get svc -o wide && \
	echo "" && \
	echo ">> Pod Information...." && \
	echo "" && \
	kubectl get pods -o wide && \
	echo ">> Waiting for network-node pods to be active (first deployment takes ~10m)...." && \
  	kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l fullstack.hedera.com/type=network-node --timeout=900s
	echo "" && \
    echo ">> Service Information...." && \
    echo "" && \
	kubectl get svc -o wide && \
	echo ">> Waiting for pods to be up (timeout 600s)" && \
	kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l fullstack.hedera.com/type=network-node --timeout=600s

.PHONY: destroy-network
destroy-network: destroy-test-container destroy-chart

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

######################################### Gateway API #################################
.PHONY: deploy-gateway-api
deploy-gateway-api:
	#source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && deploy_haproxy_ingress
	source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && deploy_envoy_gateway_api

.PHONY: destroy-gateway-api
destroy-gateway-api:
	#source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && destroy_haproxy_ingress
	source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && destroy_envoy_gateway_api

######################################### Telemetry #################################
.PHONY: fetch-prometheus-operator-bundle
fetch-prometheus-operator-bundle:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && fetch-prometheus-operator-bundle

.PHONY: deploy-prometheus-operator
deploy-prometheus-operator: fetch-prometheus-operator-bundle
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy-prometheus-operator

.PHONY: destroy-prometheus-operator
destroy-prometheus-operator:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && destroy-prometheus-operator

.PHONY: deploy-grafana-tempo
deploy-grafana-tempo:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy_grafana_tempo && expose_grafana

.PHONY: destroy-grafana-tempo
destroy-grafana-tempo:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && unexpose_grafana && destroy_grafana_tempo

.PHONY: deploy-prometheus
deploy-prometheus: deploy-prometheus-operator
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy-prometheus && expose_prometheus

.PHONY: destroy-prometheus
destroy-prometheus:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && unexpose_prometheus && destroy-prometheus

.PHONY: deploy-telemetry-stack
deploy-telemetry-stack: deploy-prometheus deploy-grafana-tempo

.PHONY: destroy-telemetry-stack
destroy-telemetry-stack:
	# Note: - prefix ensures errors are ignored and continues
	-${MAKE} destroy-prometheus
	-${MAKE} destroy-grafana-tempo

######################################### MinIO #################################
.PHONY: deploy-minio-operator
deploy-minio-operator:
	@echo ">> Deploying minio operator..."; \
	helm install --repo https://operator.min.io/ --namespace=minio-operator --create-namespace --version 5.0.7 minio-operator operator && \
	echo ">> Waiting for minio operator to be available (timeout 300s)..." && \
	kubectl --namespace=minio-operator  wait --for=condition=Available --timeout=300s deployment.apps/minio-operator && \
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
	echo ">> Deleting minio operator..." && \
	helm delete --namespace=minio-operator minio-operator


######################################### Helm Chart Test #################################
.PHONY: helm-test
helm-test:
	source "${SCRIPTS_DIR}/main.sh" && run_helm_chart_tests "network-test" || exit 1

.PHONY: destroy-test-container
destroy-test-container:
	echo "" && \
	echo ">> Deleting test container..." && \
	kubectl delete pod network-test || true

######################################### CI #################################
.PHONY: local-kubectl-bats
local-kubectl-bats:
	source "${SCRIPTS_DIR}/${DOCKER_SCRIPT}" && build_kubectl_bats "${CLUSTER_NAME}"

# Here we run all steps in sequence, if any step fails, deploy-all trap the EXIT and run cleanup
.PHONY: run-deploy-seq
run-deploy-seq: setup deploy-network helm-test setup-nodes start-nodes

.PHONY: deploy-all
deploy-all:
	# Enable cleanup_test function so that even if test fails, we cleanup the cluster.
	# We are only enabling this in this make target, however if necessary, similar pattern can be used in other targets.
	# Ref: https://stackoverflow.com/questions/28597794/how-can-i-clean-up-after-an-error-in-a-makefile
	function cleanup_test {
		$(MAKE) destroy-network
	}
	trap cleanup_test EXIT # always destroy-network on exit
	$(MAKE) run-deploy-seq

.PHONY: destroy-all
destroy-all:
	-$(MAKE) destroy-network
	-$(MAKE) undeploy-minio-operator
	-$(MAKE) destroy-prometheus-operator

.PHONY: ci-test
ci-test: setup-cluster local-kubectl-bats
	$(MAKE) deploy-all CHART_VALUES_FILES="$(PWD)/ci/ci-values.yaml"

.PHONY: ci-deploy-network
ci-deploy-network: setup-cluster local-kubectl-bats
	$(MAKE) deploy-network CHART_VALUES_FILES="$(PWD)/ci/ci-values.yaml"
	$(MAKE) helm-test
