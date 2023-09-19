#!/usr/bin/env bash

CUR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
source "${CUR_DIR}/env.sh"

function setup_cluster() {
  [[ -z "${CLUSTER_NAME}" ]] && echo "ERROR: [setup_cluster] Cluster name is required" && return 1
  [[ -z "${NAMESPACE}" ]] && echo "ERROR: [setup_cluster] Namespace name is required" && return 1

	echo "Cluster name: ${CLUSTER_NAME}"
  local count=$(kind get clusters -q | grep -c -sw "${CLUSTER_NAME}")
  if [[ $count -eq 0 ]]; then
	    echo "Cluster '${CLUSTER_NAME}' not found"
		  kind create cluster -n "${CLUSTER_NAME}"
		  kubectl create ns "${NAMESPACE}"
	else
	    echo "Cluster '${CLUSTER_NAME}' found"
  fi

	setup_kubectl_context
}

function destroy_cluster() {
  [[ -z "${CLUSTER_NAME}" ]] && echo "ERROR: [destroy_cluster] Cluster name is required" && return 1
  [[ -z "${NAMESPACE}" ]] && echo "ERROR: [destroy_cluster] Namespace name is required" && return 1

	kind delete cluster -n "${CLUSTER_NAME}" || true
	kubectl delete ns "${NAMESPACE}" || true
}

function deploy_shared() {
  deploy_pod_monitor_role
  deploy_fst_gateway_class
}

function destroy_shared() {
  destroy_pod_monitor_role
  destroy_fst_gateway_class
}

function deploy_pod_monitor_role() {
  setup_kubectl_context

	echo "Installing pod monitor role: ${POD_MONITOR_ROLE}"
  echo "-----------------------------------------------------------------------------------------------------"
  local pod_monitor_role=$(kubectl get ClusterRole "${POD_MONITOR_ROLE}" -o jsonpath='{.metadata.labels.fullstack\.hedera\.com\/type}')
  if [[ -z "${pod_monitor_role}" ]]; then
    kubectl create -f "${COMMON_RESOURCES}/pod-monitor-role.yaml"
  else
    echo "Pod monitor role '${POD_MONITOR_ROLE}' is already installed"
    echo ""
  fi

  echo "-----------------------Pod Monitor Role------------------------------------------------------------------------------"
  kubectl get clusterrole "${POD_MONITOR_ROLE}" -o wide
  echo ""
}

function destroy_pod_monitor_role() {
  setup_kubectl_context

	echo "Uninstalling pod monitor role: ${POD_MONITOR_ROLE}"
  echo "-----------------------------------------------------------------------------------------------------"
  local pod_monitor_role=$(kubectl get ClusterRole "${POD_MONITOR_ROLE}" -o jsonpath='{.metadata.labels.fullstack\.hedera\.com\/type}')
  if [[ -n "${pod_monitor_role}" ]]; then
    kubectl delete -f "${COMMON_RESOURCES}/pod-monitor-role.yaml"
  fi

  echo "-----------------------Pod Monitor Role------------------------------------------------------------------------------"
  kubectl get clusterrole "${POD_MONITOR_ROLE}" -o wide

  echo "Pod monitor role '${POD_MONITOR_ROLE}' is uninstalled"
  echo ""
}

function deploy_fst_gateway_class() {
  echo ""
	echo "Installing FST Gateway Class: ${GATEWAY_CLASS_NAME}"
  echo "-----------------------------------------------------------------------------------------------------"
  local fst_gateway_class_type=$(kubectl get gc "${GATEWAY_CLASS_NAME}" -o jsonpath='{.metadata.labels.fullstack\.hedera\.com\/type}')
  if [[ ! "${fst_gateway_class_type}" = "gateway-class" ]]; then
    kubectl create -f "${COMMON_RESOURCES}/fst-gateway.yaml"
    kubectl wait --for=condition=Accepted gc "${GATEWAY_CLASS_NAME}" --timeout=300s
  else
    echo "FST Gateway Class '${GATEWAY_CLASS_NAME}' is already installed"
    echo ""
  fi

  echo "-----------------------Gateway Class------------------------------------------------------------------------------"
  kubectl get gatewayclass
  echo ""
}

function destroy_fst_gateway_class() {
  echo ""
	echo "Uninstalling FST Gateway Class: ${GATEWAY_CLASS_NAME}"
  echo "-----------------------------------------------------------------------------------------------------"
  local fst_gateway_class_type=$(kubectl get gc "${GATEWAY_CLASS_NAME}" -o jsonpath='{.metadata.labels.fullstack\.hedera\.com\/type}')
  if [[ ! "${fst_gateway_class_type}" = "gateway-class" ]]; then
    kubectl delete -f "${COMMON_RESOURCES}/fst-gateway.yaml"
    sleep 2s
  fi

  echo "-----------------------Gateway Class------------------------------------------------------------------------------"
  kubectl get gatewayclass

  echo "FST Gateway Class '${GATEWAY_CLASS_NAME}' is uninstalled"
  echo ""
}

function install_chart() {
  local node_setup_script=$1
  [[ -z "${node_setup_script}" ]] && echo "ERROR: [install_chart] Node setup script name is required" && return 1

  setup_kubectl_context

  echo ""
  echo "Installing helm chart... "
  echo "SCRIPT_NAME: ${node_setup_script}"
  echo "Values: -f ${CHART_DIR}/values.yaml --values ${CHART_VALUES_FILES}"
  echo "-----------------------------------------------------------------------------------------------------"
  if [ "${node_setup_script}" = "nmt-install.sh" ]; then
    nmt_install
  else
    direct_install
  fi
}

function uninstall_chart() {
  [[ -z "${HELM_RELEASE_NAME}" ]] && echo "ERROR: [uninstall_chart] Helm release name is required" && return 1

  echo ""
  echo "Uninstalling helm chart... "
  echo "-----------------------------------------------------------------------------------------------------"
 	helm uninstall "${HELM_RELEASE_NAME}"
 	sleep 10
}

function nmt_install() {
  [[ -z "${HELM_RELEASE_NAME}" ]] && echo "ERROR: [nmt_install] Helm release name is required" && return 1
  [[ -z "${NAMESPACE}" ]] && echo "ERROR: [nmt_install] Namespace name is required" && return 1

  if [[ -z "${CHART_VALUES_FILES}" ]]; then
    helm install "${HELM_RELEASE_NAME}" -n "${NAMESPACE}" "${CHART_DIR}" --set defaults.root.image.repository=hashgraph/full-stack-testing/ubi8-init-dind
  else
    helm install "${HELM_RELEASE_NAME}" -n "${NAMESPACE}"  "${CHART_DIR}" -f "${CHART_DIR}/values.yaml" --values "${CHART_VALUES_FILES}" --set defaults.root.image.repository=hashgraph/full-stack-testing/ubi8-init-dind
  fi
}

function direct_install() {
  [[ -z "${HELM_RELEASE_NAME}" ]] && echo "ERROR: [direct_install] Helm release name is required" && return 1
  [[ -z "${NAMESPACE}" ]] && echo "ERROR: [direct_install] Namespace name is required" && return 1

  if [[ -z "${CHART_VALUES_FILES}" ]]; then
    helm install "${HELM_RELEASE_NAME}" -n "${NAMESPACE}" "${CHART_DIR}"
  else
    helm install "${HELM_RELEASE_NAME}" -n "${NAMESPACE}" "${CHART_DIR}" -f "${CHART_DIR}/values.yaml" --values "${CHART_VALUES_FILES}"
  fi
}

function run_helm_chart_tests() {
  [[ -z "${HELM_RELEASE_NAME}" ]] && echo "ERROR: [run_helm_chart_tests] Helm release name is required" && return 1

  setup_kubectl_context

  local test_name=$1 # pod name in the tests/test-deployment.yaml file
  [[ -z "${test_name}" ]] && echo "ERROR: test name is required" && return 1

  echo ""
  echo "Running helm chart tests (first run takes ~2m)... "
  echo "-----------------------------------------------------------------------------------------------------"

	helm test "${HELM_RELEASE_NAME}" --filter name="${test_name}"

  local test_status=$(kubectl get pod "${test_name}" -o jsonpath='{.status.phase}' | xargs)
  echo "Helm test status: ${test_status}"

  echo ""
	echo "kubectl logs ${test_name}"
  echo "=========================================="
	kubectl logs "${test_name}"

	if [[ "${test_status}" != "Succeeded" ]]; then
	  echo "Returning exit code 1"
	  return 1
	fi
}