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
SCRIPTS_DIR=$(PWD)/scripts
CHART_DIR=$(PWD)/../charts/fullstack-deployment
SCRIPT_NAME=direct-install.sh
TMP_DIR=${SCRIPTS_DIR}/../temp

CLUSTER_SETUP_VALUES_FILE=${TMP_DIR}/cluster-values.yaml
CHART_VALUES_FILES= # extra values

# scripts
TELEMETRY_SCRIPT="telemetry.sh"
GATEWAY_API_SCRIPT="gateway.sh"
DOCKER_SCRIPT="docker.sh"

.PHONY: setup
setup:
	source "${SCRIPTS_DIR}/main.sh" && setup

.PHONY: setup-cluster
setup-cluster:
	source "${SCRIPTS_DIR}/main.sh" && setup_cluster

.PHONY: destroy-cluster
destroy-cluster:
	source "${SCRIPTS_DIR}/main.sh" && destroy_cluster

.PHONY: install-chart
install-chart:
	source "${SCRIPTS_DIR}/main.sh" && install_chart "${SCRIPT_NAME}"

.PHONY: uninstall-chart
uninstall-chart:
	source "${SCRIPTS_DIR}/main.sh" && uninstall_chart

.PHONY: update-helm-dependencies
update-helm-dependencies:
	helm dependency update ../charts/fullstack-deployment
	helm dependency update ../charts/fullstack-cluster-setup

.PHONY: init-shared
init-shared:
	echo "cloud:" > ${CLUSTER_SETUP_VALUES_FILE}

.PHONY: deploy-shared
deploy-shared: init-shared update-helm-dependencies deploy-gateway-api enable-prometheus-operator-if-required enable-minio-operator-if-required
	source "${SCRIPTS_DIR}/main.sh" && deploy_shared # run only after gateway-api CRDs are available

.PHONY: destroy-shared
destroy-shared:
	source "${SCRIPTS_DIR}/main.sh" && destroy_shared

.PHONY: deploy-chart
deploy-chart:
	$(MAKE) deploy-shared
	$(MAKE) install-chart

.PHONY: destroy-chart
destroy-chart:
	-$(MAKE) uninstall-chart
	-$(MAKE) destroy-shared

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
destroy-network: destroy-test-container uninstall-chart

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
start: ci-deploy-network setup-nodes start-nodes

.PHONY: stop
stop: stop-nodes destroy-network

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
.PHONY: enable-prometheus-operator-if-required
enable-prometheus-operator-if-required:
	@$(MAKE) is-prometheus-operator-installed || $(MAKE) enable-prometheus-operator

.PHONY: enable-prometheus-operator
enable-prometheus-operator:
	@echo ">> Enabling prometheus operator..."; \
	echo "  prometheusOperator:" >> ${CLUSTER_SETUP_VALUES_FILE}; \
	echo "    enable: true" >> ${CLUSTER_SETUP_VALUES_FILE};

.PHONY: is-prometheus-operator-installed
is-prometheus-operator-installed:
	@echo ">> Checking for prometheus operator..."; \
	kubectl get pods --all-namespaces | grep prometheus-operator &> /dev/null && { echo "Found prometheus operator."; exit 0; }; \
	echo "Prometheus operator not found."; exit 1

# prometheus-operator version set in scripts/env.sh:PROMETHEUS_VERSION
.PHONY: update-prometheus-operator
update-prometheus-operator:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && update-prometheus-operator

.PHONY: deploy-grafana-tempo
deploy-grafana-tempo:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy_grafana_tempo && expose_grafana

.PHONY: destroy-grafana-tempo
destroy-grafana-tempo:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && unexpose_grafana && destroy_grafana_tempo

.PHONY: deploy-prometheus
deploy-prometheus: init-shared deploy-gateway-api enable-prometheus-operator
	source "${SCRIPTS_DIR}/main.sh" && deploy_shared # run only after gateway-api CRDs are available
	-$(MAKE) wait-for-prometheus-operator
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy-prometheus && expose_prometheus

.PHONY: wait-for-prometheus-operator
wait-for-prometheus-operator:
	kubectl wait --for=condition=Ready pods -l app.kubernetes.io/name=prometheus-operator --timeout 300s --all-namespaces

.PHONY: destroy-prometheus
destroy-prometheus:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && unexpose_prometheus && destroy-prometheus
	-$(MAKE) destroy-shared

.PHONY: deploy-telemetry-stack
deploy-telemetry-stack: deploy-prometheus deploy-grafana-tempo

.PHONY: destroy-telemetry-stack
destroy-telemetry-stack:
	# Note: - prefix ensures errors are ignored and continues
	-${MAKE} destroy-prometheus
	-${MAKE} destroy-grafana-tempo

######################################### MinIO #################################
.PHONY: enable-minio-operator
enable-minio-operator:
	@echo ">> Enabling minio operator..."; \
	echo "  minio:" >> ${CLUSTER_SETUP_VALUES_FILE}; \
	echo "    enable: true" >> ${CLUSTER_SETUP_VALUES_FILE};

.PHONY: is-minio-operator-installed
is-minio-operator-installed:
	@echo ">> Checking for minio operator..."; \
	kubectl get pods --all-namespaces | grep minio-operator &> /dev/null && { echo "Found minio operator."; exit 0; }; \
	echo "Minio operator not found."; exit 1

.PHONY: enable-minio-operator-if-required
enable-minio-operator-if-required:
	@$(MAKE) is-minio-operator-installed || $(MAKE) enable-minio-operator

######################################### Helm Chart Test #################################
.PHONY: helm-test
helm-test:
	source "${SCRIPTS_DIR}/main.sh" && run_helm_chart_tests "network-test" || exit 1

.PHONY: destroy-test-container
destroy-test-container:
	echo "" && \
	echo ">> Deleting test container..." && \
	kubectl delete pod network-test -n "${NAMESPACE}" || true

######################################### CI #################################
.PHONY: local-kubectl-bats
local-kubectl-bats:
	source "${SCRIPTS_DIR}/${DOCKER_SCRIPT}" && build_kubectl_bats "${CLUSTER_NAME}"

.PHONY: ci-test
ci-test:
	# Enable cleanup_test function so that even if test fails, we cleanup the cluster.
	# We are only enabling this in this make target, however if necessary, similar pattern can be used in other targets.
	# Ref: https://stackoverflow.com/questions/28597794/how-can-i-clean-up-after-an-error-in-a-makefile
	# NOTE: It needs latest make (version ~=4.3)
	function cleanup_test () {
		$(MAKE) destroy-network
	}
	trap cleanup_test EXIT # always destroy-network on exit
	$(MAKE) ci-deploy-network setup-nodes start-nodes

.PHONY: ci-deploy-network
ci-deploy-network: setup-cluster local-kubectl-bats
	$(MAKE) deploy-network CHART_VALUES_FILES="$(PWD)/ci/ci-values.yaml"
	$(MAKE) helm-test
