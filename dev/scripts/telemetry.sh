#!/usr/bin/env bash
CUR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
source "${CUR_DIR}/env.sh"
setup_kubectl_context

# Run the below command to retrieve the latest version
# curl -s "https://api.github.com/repos/prometheus-operator/prometheus-operator/releases/latest" | jq -cr .tag_name

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

	log_time "fetch-prometheus-operator-bundle"
}

function deploy-prometheus-operator() {
  fetch-prometheus-operator-bundle

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

	log_time "deploy-prometheus-operator"
}

function destroy-prometheus-operator() {
  echo ""
	echo "Destroying prometheus operator"
	echo "PROMETHEUS_OPERATOR_YAML: ${PROMETHEUS_OPERATOR_YAML}"
  echo "-----------------------------------------------------------------------------------------------------"
	kubectl delete -f "${PROMETHEUS_OPERATOR_YAML}"
	sleep 10

	log_time "destroy-prometheus-operator"
}

function deploy-prometheus() {
  echo ""
	echo "Deploying prometheus"
	echo "PROMETHEUS_RBAC_YAML: ${PROMETHEUS_RBAC_YAML}"
	echo "PROMETHEUS_YAML: ${PROMETHEUS_YAML}"
  echo "-----------------------------------------------------------------------------------------------------"
	kubectl create -f "${PROMETHEUS_RBAC_YAML}"

	# create ClusterRole binding with the correct namespace
	# NOTE: take care of indentation in the yaml if it needs to be updated
	echo "
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRoleBinding
  metadata:
    name: prometheus
  roleRef:
    apiGroup: rbac.authorization.k8s.io
    kind: ClusterRole
    name: prometheus
  subjects:
    - kind: ServiceAccount
      name: prometheus
      namespace: ${NAMESPACE}" | kubectl create -f -

	sleep 10

	kubectl create -f "${PROMETHEUS_YAML}"

	echo "Waiting for prometheus to be active (timeout 300s)..."
	kubectl wait --for=condition=Ready pods -l  app.kubernetes.io/name=prometheus --timeout 300s -n "${NAMESPACE}"

	log_time "deploy-prometheus"
}

function destroy-prometheus() {
  echo ""
	echo "Destroying prometheus"
	echo "PROMETHEUS_RBAC_YAML: ${PROMETHEUS_RBAC_YAML}"
	echo "PROMETHEUS_YAML: ${PROMETHEUS_YAML}"
  echo "-----------------------------------------------------------------------------------------------------"
	kubectl delete -f "${PROMETHEUS_YAML}" || true
	kubectl delete -f "${PROMETHEUS_RBAC_YAML}" || true
	kubectl delete clusterrolebindings prometheus || true
	sleep 5

	log_time "destroy-prometheus"
}

function deploy-prometheus-example-app() {
  echo ""
	echo "Deploying prometheus-example-app"
	echo "PROMETHEUS_EXAMPLE_APP_YAML: ${PROMETHEUS_EXAMPLE_APP_YAML}"
  echo "-----------------------------------------------------------------------------------------------------"
	kubectl create -f "${PROMETHEUS_EXAMPLE_APP_YAML}"
  echo "Waiting for prometheus example app to be active (timeout 300s)..."
	kubectl wait --for=condition=Ready pods -l  app=prometheus-example-app --timeout 300s
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

function expose_prometheus() {
  export POD_NAME=$(kubectl get pods -l "app.kubernetes.io/name=prometheus,app.kubernetes.io/instance=prometheus" -o jsonpath="{.items[0].metadata.name}")
  kubectl port-forward "${POD_NAME}" 9090 &
  echo "Prometheus is exposed from ${POD_NAME} to port 9090"
}

function unexpose_prometheus() {
  export POD_NAME=$(kubectl get pods -l "app.kubernetes.io/name=prometheus,app.kubernetes.io/instance=prometheus" -o jsonpath="{.items[0].metadata.name}")
  export PID=$(ps aux | grep "port-forward ${POD_NAME}" | sed -n 2p | awk '{ print $2 }')
  [[ -z "${PID}" ]] && echo "No Prometheus port-forward PID is found" && return 0

  if [[ "${PID}" ]]; then
    echo ""
    echo "Un-exposing Prometheus: ${POD_NAME} for PID: ${PID}"
    echo "-----------------------------------------------------------------------------------------------------"
    kill "${PID}" &>/dev/null || true
  fi
}

function deploy_grafana_tempo() {
  echo ""
	echo "Deploying Grafana"
  echo "-----------------------------------------------------------------------------------------------------"
  helm repo add grafana https://grafana.github.io/helm-charts
  helm repo update
  helm upgrade --install tempo grafana/tempo
  echo "Waiting for tempo to be active (timeout 300s)..."
  kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l "app.kubernetes.io/name=tempo,app.kubernetes.io/instance=tempo" --timeout=300s

  helm upgrade -f "${TELEMETRY_DIR}/grafana/grafana-values.yaml" --install grafana grafana/grafana
  echo "Waiting for grafana to be active (timeout 300s)..."
  kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l "app.kubernetes.io/name=grafana,app.kubernetes.io/instance=grafana" --timeout=300s

  log_time "deploy_grafana_tempo"
}

function destroy_grafana_tempo() {
  echo ""
	echo "Destroying Grafana"
  echo "-----------------------------------------------------------------------------------------------------"
  helm delete grafana
  helm delete tempo
}

function expose_grafana() {
  export POD_NAME=$(kubectl get pods -l "app.kubernetes.io/name=grafana,app.kubernetes.io/instance=grafana" -o jsonpath="{.items[0].metadata.name}")
  kubectl port-forward $POD_NAME 3000 &
  echo "Grafana is exposed from ${POD_NAME} to port 3000"
}

function unexpose_grafana() {
  export POD_NAME=$(kubectl get pods -l "app.kubernetes.io/name=grafana,app.kubernetes.io/instance=grafana" -o jsonpath="{.items[0].metadata.name}")
  export PID=$(ps aux | grep "port-forward ${POD_NAME}" | sed -n 2p | awk '{ print $2 }')
  [[ -z "${PID}" ]] && echo "No Grafana port-forward PID is found" && return 0

  if [[ "${PID}" ]]; then
    echo ""
    echo "Un-exposing Grafana: ${POD_NAME} for PID: ${PID}"
    echo "-----------------------------------------------------------------------------------------------------"
    kill "${PID}" &>/dev/null || true
  fi
}

function deploy_tracing_example_app() {
  echo ""
	echo "Deploying Example Tracing App"
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl create -f "${TELEMETRY_DIR}/grafana/example-tracing-app.yaml"
  echo "Waiting for tracing example app to be active (timeout 300s)..."
	kubectl wait --for=condition=Ready pods -l  app=xk6-tracing --timeout 300s
}

function destroy_tracing_example_app() {
  echo ""
	echo "Destroying Example Tracing App"
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl delete -f "${TELEMETRY_DIR}/grafana/example-tracing-app.yaml"
}
