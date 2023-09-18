#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

readonly SCRIPT_DIR
readonly TMP_DIR="${SCRIPT_DIR}/../temp"
readonly CHART_DIR="${SCRIPT_DIR}/../../charts/hedera-network"


# telemetry related env variables
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

function setup_temp_dir() {
	if [ ! -f "${TMP_DIR}/.env" ]; then \
	  echo "Creating .env file from template.env"
		cp "${SCRIPT_DIR}/template.env" "${TMP_DIR}/.env"
	  echo "File list in ${TMP_DIR}"
	  ls -la "${TMP_DIR}"
	fi
}

function load_env_file() {
	if [ -f "${TMP_DIR}/.env" ]; then \
    set -a
    # shellcheck source=./../temp/.env
    source "${TMP_DIR}/.env"
    set +a
  fi
}

function setup_kubectl_context() {
  load_env_file
  [[ -z "${CLUSTER_NAME}" ]] && echo "ERROR: Cluster name is required" && return 1
  [[ -z "${NAMESPACE}" ]] && echo "ERROR: Namespace name is required" && return 1

  echo "List of namespaces:"
	kubectl get ns

	echo "Setting kubectl context..."
	kubectl config use-context "kind-${CLUSTER_NAME}"
	kubectl config set-context --current --namespace="${NAMESPACE}"
	kubectl config get-contexts
}

function setup() {
  setup_temp_dir
  load_env_file
}

setup
