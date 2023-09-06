#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly SCRIPT_DIR
CHART_DIR="${SCRIPT_DIR}/../../charts/hedera-network"

function install_chart() {
  local node_setup_script=$1

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
  echo ""
  echo "Uninstalling helm chart... "
  echo "-----------------------------------------------------------------------------------------------------"
 	helm uninstall fst
 	sleep 10
}

function nmt_install() {
  if [[ -z "${CHART_VALUES_FILES}" ]]; then
    helm install fst "${CHART_DIR}" --set defaults.root.image.repository=hashgraph/full-stack-testing/ubi8-init-dind
  else
    helm install fst "${CHART_DIR}" -f "${CHART_DIR}/values.yaml" --values "${CHART_VALUES_FILES}" --set defaults.root.image.repository=hashgraph/full-stack-testing/ubi8-init-dind
  fi
}

function direct_install() {
  if [[ -z "${CHART_VALUES_FILES}" ]]; then
    helm install fst "${CHART_DIR}"
  else
    helm install fst "${CHART_DIR}" -f "${CHART_DIR}/values.yaml" --values "${CHART_VALUES_FILES}"
  fi
}
