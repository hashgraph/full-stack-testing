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
  deploy_fullstack_cluster_setup_chart
}

function destroy_shared() {
  destroy_fullstack_cluster_setup_chart
}

function deploy_fullstack_cluster_setup_chart() {
  setup_kubectl_context

	echo "Installing fullstack-cluster-setup chart"
  echo "-----------------------------------------------------------------------------------------------------"
  local count=$(helm list --all-namespaces -q | grep -c "fullstack-cluster-setup")
  if [[ $count -eq 0 ]]; then
    helm install -n "${NAMESPACE}" "fullstack-cluster-setup" "${SETUP_CHART_DIR}"
  else
    echo "fullstack-cluster-setup chart is already installed"
    echo ""
  fi

  echo "-----------------------Shared Resources------------------------------------------------------------------------------"
  kubectl get clusterrole "${POD_MONITOR_ROLE}" -o wide
  kubectl get gatewayclass
  echo ""
}

function destroy_fullstack_cluster_setup_chart() {
  setup_kubectl_context

	echo "Uninstalling fullstack-cluster-setup chart"
  echo "-----------------------------------------------------------------------------------------------------"
  local count=$(helm list --all-namespaces -q | grep -c "fullstack-cluster-setup")
  if [[ $count -ne 0 ]]; then
    helm uninstall -n "${NAMESPACE}" "fullstack-cluster-setup"
  else
    echo "fullstack-cluster-setup chart is already installed"
    echo ""
  fi

  echo "-----------------------Shared Resources------------------------------------------------------------------------------"
  kubectl get clusterrole "${POD_MONITOR_ROLE}" -o wide
  kubectl get gatewayclass
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
  local count=$(helm list -q -n "${NAMESPACE}" | grep -c "${HELM_RELEASE_NAME}")
  if [[ $count -eq 0 ]]; then
    if [ "${node_setup_script}" = "nmt-install.sh" ]; then
      nmt_install
    else
      direct_install
    fi
  else
    echo "${HELM_RELEASE_NAME} is already installed"
  fi
}

function uninstall_chart() {
  [[ -z "${HELM_RELEASE_NAME}" ]] && echo "ERROR: [uninstall_chart] Helm release name is required" && return 1

  echo ""
  local count=$(helm list -q -n "${NAMESPACE}" | grep -c "${HELM_RELEASE_NAME}")
  if [[ $count -ne 0 ]]; then
    echo "Uninstalling helm chart ${HELM_RELEASE_NAME} in namespace ${NAMESPACE}... "
    echo "-----------------------------------------------------------------------------------------------------"
 	  helm uninstall -n "${NAMESPACE}" "${HELM_RELEASE_NAME}"
 	  sleep 10
    echo "Uninstalled helm chart ${HELM_RELEASE_NAME} in namespace ${NAMESPACE}"
  else
    echo "Helm chart '${HELM_RELEASE_NAME}' not found in namespace ${NAMESPACE}. Nothing to uninstall. "
 	fi
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
  echo "Running helm chart tests (takes ~5m)... "
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