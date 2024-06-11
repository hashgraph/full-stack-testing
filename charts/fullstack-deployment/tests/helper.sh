#!/usr/bin/env bash

# setup test constants
readonly EX_OK=0
readonly EX_ERR=1
readonly PASS="PASS"
readonly FAIL="FAIL"

# template variables to be rendered during helm chart deployment
readonly TMPL_TOTAL_NODES="{{ .total_nodes }}"

# Setup test variables
if [[ -z "${TOTAL_NODES}" ]]; then
  TOTAL_NODES="${TMPL_TOTAL_NODES}"
fi

####
# Imports a bash file using the built-in source command.
#
# @param $1 - the bash file to be imported
####
function import {
  if [[ -z "${1}" || ! -f "${1}" ]]; then
    return "${EX_OSFILE}"
  elif [[ -f "${1}" ]]; then
    echo "Import: Dependency Included [ file = '${1}' ]"
    # shellcheck disable=SC1090
    source "${1}"
    return "$?"
  fi
}

function get_pod_list() {
  local pattern=$1
  local resp=$(kubectl get pods -o=jsonpath='{range .items[*]}{.metadata.name}{"\n"}' -n "${NAMESPACE}"  | grep "${pattern}")
  echo "${resp}"
}

function run_test_cases() {
  local test_cases=("${@}")
  if [ $# -eq 0 ]; then
    test_cases=("${TEST_CASES[@]}")
  fi

  echo "Test cases"
  echo "-------------------------------------------------------------"
  for test_case in "${test_cases[@]}"; do
    echo "- ${test_case}"
  done
  echo ""

  local status="${EX_OK}"
  local test_results=()
  for test_case in "${test_cases[@]}"; do
    "${test_case}"
    local test_status="$?"
    if [[ "${test_status}" = "${EX_OK}" ]]; then
      test_results+=("${test_case}: ${PASS}")
    else
      test_results+=("${test_case}: ${FAIL}")
      status="${EX_ERR}"
    fi
  done

  echo ""
  echo "-------------------------------------------------------------"
  echo "Test results"
  echo "-------------------------------------------------------------"
  for test_result in "${test_results[@]}"; do
    echo "${test_result}"
  done

  return "${status}"
}

# This is to check the bats test execution status
function check_test_status() {
  echo "status = ${status}"
  echo "output = ${output}"
  [[ "${status}" -eq 0 ]]
}

function get_config_val() {
  local config_path=$1
  log_debug "Get config command: helm get values fst -a -n ${NAMESPACE} | yq '${config_path}'"
  ret=$(helm get values ${RELEASE_NAME} -a -n "${NAMESPACE}" | yq "${config_path}" )
  echo "${ret}"
  log_debug "${config_path} => ${ret}"
}

function get_config_val_upper() {
  local config_path=$1
  local config_val=$(get_config_val "${config_path}" | tr '[:lower:]' '[:upper:]' )
  echo "${config_val}"
}

function is_enabled_for_node() {
  local node_name=$1
  [[ -z "${node_name}" ]] && echo "ERROR: Node name is needed" && return "${EX_ERR}"

  local config_path=$2
  [[ -z "${config_path}" ]] && echo "ERROR: Config path is needed" && return "${EX_ERR}"

  log_debug "Checking config '${config_path}' for node '${node_name} in namespace ${NAMESPACE} "

  local default_config_path=".defaults${config_path}"
  local node_config_path=".hedera.nodes[] | select(.name==\"${node_name}\") | ${config_path}"
  local default_val=$(get_config_val_upper "${default_config_path}")
  local node_val=$(get_config_val_upper "${node_config_path}")
  log_debug "Default config: ${default_val}"
  log_debug "Node config: ${node_val}"

  if [ -z "${node_val}" ] || [ "${node_val}" = "FALSE" ]; then
    echo "FALSE"
    return
  fi

  if [ "${node_val}" = "TRUE" ]; then
    echo "TRUE"
    return
  fi

  if [ "${default_val}" = "TRUE" ]; then
    echo "TRUE"
    return
  fi

  echo "FALSE"
}

function get_sidecar_status() {
  local pod=$1
  local sidecar_name=$2
  [[ -z "${pod}" ]] && echo "ERROR: Pod name is needed (is_sidecar_ready)" && return "${EX_ERR}"
  [[ -z "${sidecar_name}" ]] && echo "ERROR: Sidecar name is needed (is_sidecar_ready)" && return "${EX_ERR}"

  local sidecar_status=$(kubectl get pod "${pod}" -o jsonpath="{.status.containerStatuses[?(@.name=='${sidecar_name}')].ready}" -n "${NAMESPACE}" | xargs)
  echo "${sidecar_status}"
}

function is_sidecar_ready() {
  local pod=$1
  local sidecar_name=$2
  [[ -z "${pod}" ]] && echo "ERROR: Pod name is needed (is_sidecar_ready)" && return "${EX_ERR}"
  [[ -z "${sidecar_name}" ]] && echo "ERROR: Sidecar name is needed (is_sidecar_ready)" && return "${EX_ERR}"

  local sidecar_status=$(kubectl get pod "${pod}" -o jsonpath="{.status.containerStatuses[?(@.name=='${sidecar_name}')].ready}" -n "${NAMESPACE}" | tr '[:lower:]' '[:upper:]')
  [ -z "${sidecar_status}" ] && sidecar_status="FALSE"
  log_debug "${sidecar_name} in pod ${pod} is ready in namespace ${NAMESPACE} : ${sidecar_status}"

  [[ "${sidecar_status}" = "TRUE" ]] && return "${EX_OK}"
  return "${EX_ERR}"
}

function has_sidecar() {
  local pod=$1
  local sidecar_name=$2
  [[ -z "${pod}" ]] && echo "ERROR: Pod name is needed (is_sidecar_ready)" && return "${EX_ERR}"
  [[ -z "${sidecar_name}" ]] && echo "ERROR: Sidecar name is needed (is_sidecar_ready)" && return "${EX_ERR}"

  local sidecars=$(kubectl get pods "${pod}" -o jsonpath='{.spec.containers[*].name}' -n "${NAMESPACE}")
  log_debug "Sidecar list in pod ${pod} in namespace ${NAMESPACE} : ${sidecars}"

  local found="FALSE"
  if [[ "${sidecars}" =~ ${sidecar_name} ]]; then
    found="TRUE"
  fi

  echo "${found}"
}

function is_pod_phrase_running() {
  local pod=$1
  [[ -z "${pod}" ]] && echo "ERROR: Pod name is needed (is_pod_phrase_running)" && return "${EX_ERR}"

  local pod_status=$(kubectl get pod "${pod}" -o jsonpath="{.status.phase}" -n "${NAMESPACE}")
  [ -z "${pod_status}" ] && pod_status="Running"

  log_debug "Pod '${pod}' is running in namespace ${NAMESPACE} : ${pod_status}"

  [[ "${pod_status}" = "Running" ]] && return "${EX_OK}"
  return "${EX_ERR}"
}

function is_pod_ready() {
  local pod=$1
  [[ -z "${pod}" ]] && echo "ERROR: Pod name is needed (is_pod_ready)" && return "${EX_ERR}"

  local pod_status=$(kubectl get pod "${pod}" -o jsonpath="{.status.conditions[?(@.type=='Ready')].status}" -n "${NAMESPACE}" | tr '[:lower:]' '[:upper:]')
  [ -z "${pod_status}" ] && pod_status="FALSE"

  log_debug "Pod '${pod}' is ready in namespace ${NAMESPACE} : ${pod_status}"

  [[ "${pod_status}" = "TRUE" ]] && return "${EX_OK}"
  return "${EX_ERR}"
}

function get_pod_label() {
  local pod=$1
  [[ -z "${pod}" ]] && echo "ERROR: Pod name is needed" && return "${EX_ERR}"

  local label=$2
  [[ -z "${pod}" ]] && echo "ERROR: Label name is needed" && return "${EX_ERR}"


  log_debug "Checking for pod '${pod}' in namespace ${NAMESPACE} (timeout 300s)..."
  $(kubectl wait --for=condition=Initialized pods "${pod}" --timeout 300s -n "${NAMESPACE}") > /dev/null 2>&1
  if [ $? = 1 ]; then
    log_debug "ERROR: Pod ${pod} is not available" &&  return "${EX_ERR}"
  fi

  log_debug "Checking label '${label}' for pod '${pod}' in namespace ${NAMESPACE} "
  local escaped_label="${label//./\\.}"
  local label_val=$(kubectl get pod "${pod}" -o jsonpath="{.metadata.labels.${escaped_label}}" -n "${NAMESPACE}" | xargs)
  log_debug "Pod '${pod}' label '${label}': ${label_val}"

  echo "${label_val}"
}

function get_pod_by_label() {
  local label=$1
  [[ -z "${pod}" ]] && echo "ERROR: Label name is needed" && return "${EX_ERR}"

  log_debug "Getting pod by label '${label}' in namespace ${NAMESPACE} "
  local escaped_label="${label//./\\.}"
  local pod_name=$(kubectl get pods -l "${label}" -o jsonpath="{.items[0].metadata.name}" -n "${NAMESPACE}")
  echo "${pod_name}"
}

function is_route_accepted() {
  local route_type=$1
  [[ -z "${route_type}" ]] && echo "ERROR: Route type is needed" && return "${EX_ERR}"

  local route_name=$2
  [[ -z "${route_name}" ]] && echo "ERROR: Route name is needed" && return "${EX_ERR}"

  local route_status=$(kubectl get "${route_type}" "${route_name}" -o jsonpath="{.status.parents[*].conditions[?(@.type=='Accepted')].status}" -n "${NAMESPACE}" | tr '[:lower:]' '[:upper:]')
  [ -z "${route_status}" ] && route_status="FALSE"

  log_debug "${route_type} '${route_name}' in namespace ${NAMESPACE} is accepted: ${route_status}"

  [[ "${route_status}" = "TRUE" ]] && return "${EX_OK}"
  return "${EX_ERR}"
}
