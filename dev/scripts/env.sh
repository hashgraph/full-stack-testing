#!/usr/bin/env bash
start_time=$(date +%s)

# -------------------- Helper Functions --------------------------------------------------
function setup_kubectl_context() {
  load_env_file
  [[ -z "${CLUSTER_NAME}" ]] && echo "ERROR: Cluster name is required" && return 1
  [[ -z "${NAMESPACE}" ]] && echo "ERROR: Namespace name is required" && return 1

  kubectl get ns "${NAMESPACE}" &>/dev/null
  if [[ $? -ne 0 ]]; then
    kubectl create ns "${NAMESPACE}"
  fi

  echo "List of namespaces:"
	kubectl get ns

	echo "Setting kubectl context..."
	local count
	count=$(kubectl config get-contexts --no-headers | grep -c "kind-${CLUSTER_NAME}")
	if [[ $count -ne 0 ]]; then
	  kubectl config use-context "kind-${CLUSTER_NAME}"
	fi
	kubectl config set-context --current --namespace="${NAMESPACE}"
	kubectl config get-contexts
}

function log_time() {
  local end_time duration execution_time

  local func_name=$1

  end_time=$(date +%s)
  duration=$((end_time - start_time))
  execution_time=$(printf "%.2f seconds" "${duration}")
  echo "-----------------------------------------------------------------------------------------------------"
  echo "<<< ${func_name} execution took: ${execution_time} >>>"
  echo "-----------------------------------------------------------------------------------------------------"
}

function show_env_vars() {
    echo "--------------------------Env Setup: fullstack-testing ------------------------------------------------"
    echo "CLUSTER_NAME: ${CLUSTER_NAME}"
    echo "RELEASE_NAME: ${RELEASE_NAME}"
    echo "USER: ${USER}"
    echo "NAMESPACE: ${NAMESPACE}"
    echo "SCRIPT_DIR: ${SCRIPT_DIR}"
    echo "TMP_DIR: ${TMP_DIR}"
    echo "-----------------------------------------------------------------------------------------------------"
    echo ""
}

# ----------------------------- Setup ENV Variables -------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly SCRIPT_DIR
readonly TMP_DIR="${SCRIPT_DIR}/../temp"

# Setup TMP_DIR if required
if [ ! -f "${TMP_DIR}/.env" ]; then \
  echo "Creating .env file from template.env"
  cp "${SCRIPT_DIR}/template.env" "${TMP_DIR}/.env"
  echo "File list in ${TMP_DIR}"
  ls -la "${TMP_DIR}"
fi

# Load .env file if available
if [ -f "${TMP_DIR}/.env" ]; then \
    echo "Loading .env file: ${TMP_DIR}/.env"
    set -a
    # shellcheck source=./../temp/.env
    source "${TMP_DIR}/.env"
    set +a
fi

USER="${USER:-changeme}"
CLUSTER_NAME="${CLUSTER_NAME:-fst}"
NAMESPACE="${NAMESPACE:-fst-${USER}}"
RELEASE_NAME="${RELEASE_NAME:-fst}"
NMT_VERSION=v2.0.0-alpha.0
PLATFORM_VERSION=v0.39.1

POD_MONITOR_ROLE="${POD_MONITOR_ROLE:-pod-monitor-role}"
GATEWAY_CLASS_NAME="${GATEWAY_CLASS_NAME:-fst-gateway-class}"

#NODE_NAMES=(node0 node1 node2 node3)
NODE_NAMES=(node0)

POD_MONITOR_ROLE="${POD_MONITOR_ROLE:-pod-monitor-role}"
GATEWAY_CLASS_NAME="${GATEWAY_CLASS_NAME:-fst-gateway-class}"

readonly SETUP_CHART_DIR="${SCRIPT_DIR}/../../charts/fullstack-cluster-setup"
readonly CHART_DIR="${SCRIPT_DIR}/../../charts/hedera-network"

# telemetry related env variables
readonly COMMON_RESOURCES="${SCRIPT_DIR}/../common-resources"
readonly GATEWAY_API_DIR="${SCRIPT_DIR}/../gateway-api"
readonly TELEMETRY_DIR="${SCRIPT_DIR}/../telemetry"
readonly PROMETHEUS_DIR="${TELEMETRY_DIR}/prometheus"
readonly PROMETHEUS_VERSION=v0.67.1
readonly PROMETHEUS_OPERATOR_YAML="${PROMETHEUS_DIR}/prometheus-operator.yaml"
readonly PROMETHEUS_YAML="${PROMETHEUS_DIR}/prometheus.yaml"
readonly PROMETHEUS_RBAC_YAML="${PROMETHEUS_DIR}/prometheus-rbac.yaml"
readonly PROMETHEUS_EXAMPLE_APP_YAML="${PROMETHEUS_DIR}/example-app.yaml"

# docker build related env variables
readonly DOCKERFILE_DIR="${SCRIPT_DIR}/../../docker"
readonly LOCAL_DOCKER_REGISTRY="docker.fst.local" # same as in dev/ci/ci-values.yaml
readonly LOCAL_DOCKER_IMAGE_TAG="local"

show_env_vars