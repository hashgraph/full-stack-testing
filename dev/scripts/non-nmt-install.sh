#!/usr/bin/env bash

source ./helper.sh


function create_hapi_directories() {

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'mkdirs' - pod name is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container -- bash -c "mkdir -p $HAPI_PATH" || true
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "mkdir -p $HAPI_PATH/data/keys" || true
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "mkdir -p $HAPI_PATH/data/config" || true
}

function unzip_build() {
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "cd ${HAPI_PATH} && jar xvf /home/hedera/build-*" || true
}

function start_service() {
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "systemctl restart network-node" || true
}

function copy_entrypoint_sh() {
  echo ""
  echo "Copy entrypoint.sh to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_entrypoint_sh' - pod name is required"
    return "${EX_ERR}"
  fi

  local srcDir="${SCRIPT_DIR}"
  local dstDir="${HAPI_PATH}"
  local files=( "entrypoint.sh" )

  for file in "${files[@]}"; do
    copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"
  done

  return "${EX_OK}"
}

function non_nmt_install() {
    if [[ "${#NODE_NAMES[*]}" -le 0 ]]; then
      echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
      return "${EX_ERR}"
    fi
    echo ""
    echo "Processing nodes ${NODE_NAMES[*]} ${#NODE_NAMES[@]}"
    echo "-----------------------------------------------------------------------------------------------------"

    fetch_platform_build || return "${EX_ERR}"
    prep_address_book || return "${EX_ERR}"

    for node_name in "${NODE_NAMES[@]}";do
       pod="network-${node_name}-0" # pod name

       create_hapi_directories "${pod}" || return "${EX_ERR}"
       copy_platform "${pod}" || return "${EX_ERR}"
       ls_path "${pod}" "${HEDERA_HOME_DIR}" || return "${EX_ERR}"

       # hedera.crt, hedera.keys
       copy_hedera_keys "${pod}" || return "${EX_ERR}"

       # entrypoint.sh
       copy_entrypoint_sh "${pod}" || return "${EX_ERR}"

       # config.txt,settings.txt
       # log4j2.xml, api-permission.properties, application.properties, bootstrap.properties
       copy_config_files "${node_name}" "${pod}" || return "${EX_ERR}"
       ls_path "${pod}" "${HAPI_PATH}/"

       # private-${node}.pfx, public.pfx
       copy_node_keys "${node_name}" "${pod}" || return "${EX_ERR}"
       ls_path "${pod}" "${HAPI_PATH}/data/keys/"
       set_permission "${pod}" "${HAPI_PATH}"

       unzip_build "${pod}"
       start_service
    done
}

non_nmt_install