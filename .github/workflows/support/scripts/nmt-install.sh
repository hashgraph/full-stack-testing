#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly SCRIPT_DIR

# shellcheck source=./helper.sh
source "${SCRIPT_DIR}/helper.sh"

###################################### Functions To Run For All Nodes ##################################################
function setup_node_all() {
  if [[ "${#NODE_NAMES[*]}" -le 0 ]]; then
    echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
    return "${EX_ERR}"
  fi

  echo ""
  echo "Processing nodes ${NODE_NAMES[*]} ${#NODE_NAMES[@]}"
  echo "-----------------------------------------------------------------------------------------------------"

  fetch_nmt || return "${EX_ERR}"
  fetch_platform_build || return "${EX_ERR}"
  prep_address_book || return "${EX_ERR}"

  local node_name
  for node_name in "${NODE_NAMES[@]}"; do
    local pod="network-${node_name}-0" # pod name
    reset_node "${pod}"
    copy_nmt "${pod}" || return "${EX_ERR}"
    copy_platform "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HEDERA_HOME_DIR}" || return "${EX_ERR}"
    install_nmt "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HGCAPP_DIR}" || return "${EX_ERR}"
    nmt_preflight "${pod}" || return "${EX_ERR}"
    nmt_install "${pod}" || return "${EX_ERR}"
    copy_hedera_keys "${pod}" || return "${EX_ERR}"
    copy_config_files "${node_name}" "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HAPI_PATH}/"
    copy_node_keys "${node_name}" "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HAPI_PATH}/data/keys/"
    set_permission "${pod}" "${HAPI_PATH}"
    log_time "setup_node"
  done

  return "${EX_OK}"
}

function start_node_all() {
  if [[ "${#NODE_NAMES[*]}" -le 0 ]]; then
    echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
    return "${EX_ERR}"
  fi
  echo ""
  echo "Processing nodes ${NODE_NAMES[*]} ${#NODE_NAMES[@]}"
  echo "-----------------------------------------------------------------------------------------------------"

  local node_name
  for node_name in "${NODE_NAMES[@]}"; do
    local pod="network-${node_name}-0" # pod name
    nmt_start "${pod}" || return "${EX_ERR}"
    log_time "start_node"
  done

  verify_node_all || return "${EX_ERR}"

  sleep 2

  verify_haproxy || return "${EX_ERR}"

  return "${EX_OK}"
}

function stop_node_all() {
  if [[ "${#NODE_NAMES[*]}" -le 0 ]]; then
    echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
    return "${EX_ERR}"
  fi
  echo ""
  echo "Processing nodes ${NODE_NAMES[*]} ${#NODE_NAMES[@]}"
  echo "-----------------------------------------------------------------------------------------------------"

  local node_name
  for node_name in "${NODE_NAMES[@]}"; do
    local pod="network-${node_name}-0" # pod name
    nmt_stop "${pod}" || return "${EX_ERR}"
    log_time "stop_node"
  done

  return "${EX_OK}"
}

