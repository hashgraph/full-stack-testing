#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly SCRIPT_DIR
readonly TELEMETRY_DIR="${SCRIPT_DIR}/../telemetry"
readonly PROMETHEUS_DIR="${TELEMETRY_DIR}/prometheus"

# Run the below command to retrieve the latest version
# curl -s "https://api.github.com/repos/prometheus-operator/prometheus-operator/releases/latest" | jq -cr .tag_name
readonly PROMETHEUS_VERSION=v0.67.1
readonly PROMETHEUS_OPERATOR_YAML="${PROMETHEUS_DIR}/prometheus-operator.yaml"
readonly PROMETHEUS_YAML="${PROMETHEUS_DIR}/prometheus.yaml"
readonly PROMETHEUS_RBAC_YAML="${PROMETHEUS_DIR}/prometheus-rbac.yaml"
readonly PROMETHEUS_EXAMPLE_APP_YAML="${PROMETHEUS_DIR}/example-app.yaml"

function fetch-prometheus-operator-bundle() {
	if [[ ! -f "${PROMETHEUS_OPERATOR_YAML}" ]]; then \
    echo ""
		echo "Fetching prometheus bundle: https://github.com/prometheus-operator/prometheus-operator/releases/download/${PROMETHEUS_VERSION}/bundle.yaml"
		echo "PROMETHEUS_OPERATOR_YAML: ${PROMETHEUS_OPERATOR_YAML}"
    echo "-----------------------------------------------------------------------------------------------------"
		echo "Fetching prometheus bundle: https://github.com/prometheus-operator/prometheus-operator/releases/download/${PROMETHEUS_VERSION}/bundle.yaml > ${PROMETHEUS_OPERATOR_YAML}"
		curl -sL --fail-with-body "https://github.com/prometheus-operator/prometheus-operator/releases/download/${PROMETHEUS_VERSION}/bundle.yaml" -o "${PROMETHEUS_OPERATOR_YAML}"
		local status="$?"
		[[ "${status}" != 0 ]] && rm "${PROMETHEUS_OPERATOR_YAML}" && echo "ERROR: Failed to fetch prometheus bundle"
		return "${status}"
	fi
}

function deploy-prometheus-operator() {
  echo ""
	echo "Deploying prometheus operator"
	echo "PROMETHEUS_OPERATOR_YAML: ${PROMETHEUS_OPERATOR_YAML}"
  echo "-----------------------------------------------------------------------------------------------------"
  local crd_count=$(kubectl get crd | grep -c "monitoring.coreos.com" )
  if [[ $crd_count -ne 10 ]]; then
	  kubectl create -f "${PROMETHEUS_OPERATOR_YAML}"
	  kubectl get pods --all-namespaces
	  kubectl wait --for=condition=Ready pods -l  app.kubernetes.io/name=prometheus-operator --timeout 300s --all-namespaces
	else
	  echo "Prometheus operator CRD is already installed"
	  echo ""
	fi
}

function destroy-prometheus-operator() {
  echo ""
	echo "Destroying prometheus operator"
	echo "PROMETHEUS_OPERATOR_YAML: ${PROMETHEUS_OPERATOR_YAML}"
  echo "-----------------------------------------------------------------------------------------------------"
	kubectl delete -f "${PROMETHEUS_OPERATOR_YAML}"
	sleep 10
}

function deploy-prometheus() {
  echo ""
	echo "Deploying prometheus"
	echo "PROMETHEUS_RBAC_YAML: ${PROMETHEUS_RBAC_YAML}"
	echo "PROMETHEUS_YAML: ${PROMETHEUS_YAML}"
  echo "-----------------------------------------------------------------------------------------------------"
	kubectl create -f "${PROMETHEUS_RBAC_YAML}"
	sleep 10
	kubectl create -f "${PROMETHEUS_YAML}"
	echo "Waiting for prometheus to be active..."
	kubectl wait --for=condition=Ready pods -l  app.kubernetes.io/name=prometheus -n default  --timeout 300s
}

function destroy-prometheus() {
  echo ""
	echo "Destroying prometheus"
	echo "PROMETHEUS_RBAC_YAML: ${PROMETHEUS_RBAC_YAML}"
	echo "PROMETHEUS_YAML: ${PROMETHEUS_YAML}"
  echo "-----------------------------------------------------------------------------------------------------"
	kubectl delete -f "${PROMETHEUS_YAML}"
	kubectl delete -f "${PROMETHEUS_RBAC_YAML}"
	sleep 5
}

function deploy-prometheus-example-app() {
  echo ""
	echo "Deploying prometheus-example-app"
	echo "PROMETHEUS_EXAMPLE_APP_YAML: ${PROMETHEUS_EXAMPLE_APP_YAML}"
  echo "-----------------------------------------------------------------------------------------------------"
	kubectl create -f "${PROMETHEUS_EXAMPLE_APP_YAML}"
	kubectl wait --for=condition=Ready pods -l  app=prometheus-example-app -n default --timeout 60s
}

function destroy-prometheus-example-app() {
  echo ""
	echo "Destroying prometheus-example-app"
	echo "PROMETHEUS_EXAMPLE_APP_YAML: ${PROMETHEUS_EXAMPLE_APP_YAML}"
  echo "-----------------------------------------------------------------------------------------------------"
	kubectl delete -f "${PROMETHEUS_EXAMPLE_APP_YAML}"
	local status="$?"
	[[ "${status}" = 0 ]] && sleep 10
}
