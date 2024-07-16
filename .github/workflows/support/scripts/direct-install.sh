#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly SCRIPT_DIR

# shellcheck source=./helper.sh
source "${SCRIPT_DIR}/helper.sh"

function create_hapi_directories() {
  local pod="${1}"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'mkdirs' - pod name is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container -- bash -c "mkdir -p $HAPI_PATH" || true
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "mkdir -p $HAPI_PATH/data/keys" || true
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "mkdir -p $HAPI_PATH/data/config" || true
}

function unzip_build() {
  local pod="${1}"
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "cd ${HAPI_PATH} && jar xvf /home/hedera/build-*" || true
}

function start_service() {
  local pod="${1}"
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "systemctl restart network-node" || true
}

function stop_service() {
  local pod="${1}"
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "systemctl stop network-node" || true
}

function setup_node_all() {
  if [[ "${#NODE_NAMES[*]}" -le 0 ]]; then
    echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
    return "${EX_ERR}"
  fi

  echo ""
  echo "Processing nodes ${NODE_NAMES[*]} ${#NODE_NAMES[@]}"
  echo "-----------------------------------------------------------------------------------------------------"

  fetch_platform_build || return "${EX_ERR}"
  prep_address_book || return "${EX_ERR}"

  local node_name
  for node_name in "${NODE_NAMES[@]}"; do
    local pod="network-${node_name}-0" # pod name

    create_hapi_directories "${pod}" || return "${EX_ERR}"
    copy_platform "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HEDERA_HOME_DIR}" || return "${EX_ERR}"

    # hedera.crt, hedera.keys
    copy_hedera_keys "${pod}" || return "${EX_ERR}"

    # config.txt,settings.txt
    # log4j2.xml, api-permission.properties, application.properties, bootstrap.properties
    copy_config_files "${node_name}" "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HAPI_PATH}/"

    # private-${node}.pfx, public.pfx
    copy_node_keys "${node_name}" "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HAPI_PATH}/data/keys/"
    set_permission "${pod}" "${HAPI_PATH}"

    unzip_build "${pod}"
  done
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
    start_service "${pod}" || return "${EX_ERR}"
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
    stop_service "${pod}" || return "${EX_ERR}"
    log_time "stop_node"
  done

  return "${EX_OK}"
}
