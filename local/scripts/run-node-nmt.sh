#!/usr/bin/env bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# load template.env file
set -a
source "${SCRIPT_DIR}/.env"
set +a

EX_OK=0
EX_ERR=1
MAX_ATTEMPTS=10
HGCAPP_DIR="/opt/hgcapp"
HAPI_PATH="${HGCAPP_DIR}/services-hedera/HapiApp2.0"
HEDERA_HOME_DIR="/home/hedera"
NODE_NAMES="${NODE_NAMES}"

NMT_TAG="${NMT_RELEASE_TAG:-v2.0.0-alpha.0}"
NMT_RELEASE_URL="https://api.github.com/repos/swirlds/swirlds-docker/releases/tags/${NMT_TAG}"
NMT_INSTALLER="node-mgmt-tools-installer-${NMT_TAG}.run"
NMT_INSTALLER_PATH="${SCRIPT_DIR}/${NMT_INSTALLER}"
NMT_PROFILE=main

PLATFORM_TAG="${PLATFORM_RELEASE_TAG:-v0.39.1}"
PLATFORM_INSTALLER="build-${PLATFORM_TAG}.zip"
PLATFORM_INSTALLER_PATH="${SCRIPT_DIR}/build-${PLATFORM_TAG}.zip"

# Fetch NMT release
function fetch_nmt() {
  echo ""
  echo "Fetching NMT ${NMT_TAG}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [[ -f "${NMT_INSTALLER_PATH}" ]];then
    echo "Found NMT installer: ${NMT_INSTALLER_PATH}"
    return "${EX_OK}"
  fi

  echo "NMT Release URL: ${NMT_RELEASE_URL}"
  NMT_DOWNLOAD_URL=$(curl -sL \
                       -H "Accept: application/vnd.github+json" \
                       -H "Authorization: Bearer ${GITHUB_TOKEN}"\
                       -H "X-GitHub-Api-Version: 2022-11-28" \
                    "${NMT_RELEASE_URL}" | jq ".assets[0] | .url" | sed 's/\"//g')
  echo "NMT Download URL: ${NMT_DOWNLOAD_URL}"
  echo "Downloading NMT..."
  curl -L \
    -H 'Accept: application/octet-stream' \
    -H "Authorization: Bearer ${GITHUB_TOKEN}"\
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "${NMT_DOWNLOAD_URL}" -o "${NMT_INSTALLER_PATH}" || return "${EX_ERR}"

  return "${EX_OK}"
}

# Fetch platform build.zip file
function fetch_platform_build() {
  echo ""
  echo "Fetching Platform ${PLATFORM_TAG}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [[ -f "${PLATFORM_INSTALLER_PATH}" ]];then
    echo "Found Platform installer: ${PLATFORM_INSTALLER_PATH}"
    return "${EX_OK}"
  fi

  gsutil cp "gs://hedera-platform-builds/build-${PLATFORM_TAG}.zip" "${SCRIPT_DIR}" || return "${EX_ERR}"
  return "${EX_OK}"
}

# Copy NMT into root-container
function copy_nmt() {
  echo ""
  echo "Copying NMT to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_nmt' - pod name is required"
    return "${EX_ERR}"
  fi

  echo "Copying ${NMT_INSTALLER_PATH} -> ${pod}:${HEDERA_HOME_DIR}"
  kubectl cp "${NMT_INSTALLER_PATH}" "${pod}":"${HEDERA_HOME_DIR}" -c root-container || return "${EX_ERR}"

  return "${EX_OK}"
}

# Copy platform installer into root-container
function copy_platform() {
  echo ""
  echo "Copying Platform to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_platform' - pod name is required"
    return "${EX_ERR}"
  fi

  echo "Copying ${PLATFORM_INSTALLER_PATH} -> ${pod}:${HEDERA_HOME_DIR}"
  kubectl cp "${PLATFORM_INSTALLER_PATH}" "${pod}":"${HEDERA_HOME_DIR}" -c root-container || return "${EX_ERR}"

  return "${EX_OK}"
}

# copy files and set ownership to hedera:hedera
function copy_files() {
  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_files' - pod name is required"
    return "${EX_ERR}"
  fi

  local srcDir="$2"
  if [ -z "${srcDir}" ]; then
    echo "ERROR: 'copy_files' - src path is required"
    return "${EX_ERR}"
  fi

  local file="$3"
  if [ -z "${file}" ]; then
    echo "ERROR: 'copy_files' - file path is required"
    return "${EX_ERR}"
  fi

  local dstDir="$4"
  if [ -z "${dstDir}" ]; then
    echo "ERROR: 'copy_files' - dstDir path is required"
    return "${EX_ERR}"
  fi

  local mode=0755

  echo ""
  echo "Copying ${srcDir}/${file} -> ${pod}:${dstDir}/"
  kubectl cp "$srcDir/${file}" "${pod}:${dstDir}/" -c root-container || return "${EX_ERR}"

  echo "Changing ownership of ${pod}:${dstDir}/${file}"
  kubectl exec "${pod}" -c root-container -- chown hedera:hedera "${dstDir}/${file}" || return "${EX_ERR}"

  echo "Changing permission to ${mode} of ${pod}:${dstDir}/${file}"
  kubectl exec "${pod}" -c root-container -- chmod "${mode}" "${dstDir}/${file}" || return "${EX_ERR}"

  echo ""
  kubectl exec "${pod}" -c root-container -- ls -la "${dstDir}/${file}" || return "${EX_ERR}"

  return "${EX_OK}"
}

# Copy hedera keys
function copy_hedera_keys() {
  echo ""
  echo "Copy hedera TLS keys to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_hedera_keys' - pod name is required"
    return "${EX_ERR}"
  fi

  local srcDir="${SCRIPT_DIR}/../network-node"
  local dstDir="${HAPI_PATH}"
  local files=( \
    "hedera.key" \
    "hedera.crt" \
  )

  for file in "${files[@]}"; do
    copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"
  done

  return "${EX_OK}"
}

# Copy node keys
function copy_node_keys() {
  echo ""
  echo "Copy node gossip keys to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local node="$1"
  if [ -z "${node}" ]; then
    echo "ERROR: 'copy_node_keys' - node name is required"
    return "${EX_ERR}"
  fi

  local pod="$2"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_node_keys' - pod name is required"
    return "${EX_ERR}"
  fi

  local srcDir="${SCRIPT_DIR}/../network-node/data/keys"
  local dstDir="${HAPI_PATH}/data/keys"
  local files=( \
    "private-${node}.pfx" \
    "public.pfx" \
  )

  for file in "${files[@]}"; do
    copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"
  done


  return "${EX_OK}"
}

# Copy config files
function copy_config_files() {
  echo ""
  echo "Copy config files to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_config_files' - pod name is required"
    return "${EX_ERR}"
  fi

  local srcDir="${SCRIPT_DIR}/../network-node"
  local dstDir="${HAPI_PATH}"
  local files=( \
    "config.txt" \
    "settings.txt" \
    "log4j2.xml" \
    "data/config/api-permission.properties" \
    "data/config/application.properties" \
    "data/config/bootstrap.properties" \
  )

  for file in "${files[@]}"; do
    copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"
  done

  return "${EX_OK}"
}

function verify_network_state() {
  echo ""
  echo "Checking logs in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  sleep 5
  attempts=0
  status=""

  LOG_PATH="output"
  [[ "${NMT_PROFILE}" == jrs* ]] && LOG_PATH="logs"

  printf "Checking network state in: %s" "${pod}"
  while [[ "${attempts}" -lt "${MAX_ATTEMPTS}" && "${status}" != *ACTIVE* ]]; do
    sleep 5
    attempts=$((attempts + 1))
    set +e
    status="$(kubectl exec "${pod}" -c root-container -- sudo cat "${HAPI_PATH}/${LOG_PATH}/hgcaa.log" "${HAPI_PATH}/${LOG_PATH}/swirlds.log" | grep "ACTIVE")"
    set -e
    printf "Checking network status (Attempt #${attempts})... >>>>>\n %s\n <<<<<\n" "${status}"
  done

  if [[ "${status}" != *ACTIVE* ]]; then
    kubectl exec "${pod}" -c root-container -- docker logs swirlds-node
    echo "ERROR: <<< The network is not operational. >>>"
    return "${EX_ERR}"
  fi

  return "$EX_OK"
}

function ls_path() {
  echo ""
  echo "Displaying contents of ${path} from ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'ls_path' - pod name is required"
    return "${EX_ERR}"
  fi

  local path="$2"
  if [ -z "${path}" ]; then
    echo "ERROR: 'ls_path' - path is required"
    return "${EX_ERR}"
  fi

  kubectl exec "${pod}" -c root-container -- ls -al "${path}"
}

function cleanup_path() {
  echo ""
  echo "Cleanup pod directory ${HGCAPP_DIR} in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'ls_path' - pod name is required"
    return "${EX_ERR}"
  fi

  local path="$2"
  if [ -z "${path}" ]; then
    echo "ERROR: 'ls_path' - path is required"
    return "${EX_ERR}"
  fi

  kubectl exec "${pod}" -c root-container -- bash -c "rm -rf ${path}" || return "${EX_ERR}"
  return "${EX_OK}"
}

function install_nmt() {
  echo ""
  echo "Install NMT to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'ls_path' - pod name is required"
    return "${EX_ERR}"
  fi

  cleanup_path "${pod}" "${HGCAPP_DIR}/*" || return "${EX_ERR}"
  kubectl exec "${pod}" -c root-container -- chmod +x "${HEDERA_HOME_DIR}/${NMT_INSTALLER}" || return "${EX_ERR}"
  kubectl exec "${pod}" -c root-container -- "${HEDERA_HOME_DIR}/${NMT_INSTALLER}" --accept -- -fg || return "${EX_ERR}"

  return "${EX_OK}"
}

function nmt_preflight() {
  echo ""
  echo "Run Preflight in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'ls_path' - pod name is required"
    return "${EX_ERR}"
  fi
  kubectl exec "${pod}" -c root-container --  \
    node-mgmt-tool -VV preflight -j 17.0.2 -df -i "${NMT_PROFILE}" -k 1g -m 1g || return "${EX_ERR}"

  kubectl exec "${pod}" -c root-container --  \
    node-mgmt-tool -VV install \
    -p "${HEDERA_HOME_DIR}/${PLATFORM_INSTALLER}" \
    -n "${node_name}" \
    -x "${PLATFORM_TAG}" \
    || return "${EX_ERR}"

  return "${EX_OK}"
}

function nmt_install() {
  echo ""
  echo "Run Install in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'ls_path' - pod name is required"
    return "${EX_ERR}"
  fi

  kubectl exec "${pod}" -c root-container --  \
    node-mgmt-tool -VV install \
    -p "${HEDERA_HOME_DIR}/${PLATFORM_INSTALLER}" \
    -n "${node_name}" \
    -x "${PLATFORM_TAG}" \
    || return "${EX_ERR}"

  return "${EX_OK}"
}

function nmt_start() {
  echo ""
  echo "Starting platform node in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'ls_path' - pod name is required"
    return "${EX_ERR}"
  fi

  kubectl exec "${pod}" -c root-container -- node-mgmt-tool -VV start
  return "${EX_OK}"
}

function run_node_nmt() {
  if [[ "${#NODE_NAMES[*]}" -le 0 ]]; then
    echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
    return "${EX_ERR}"
  fi
  echo ""
  echo "Processing nodes ${NODE_NAMES[*]}"
  echo "-----------------------------------------------------------------------------------------------------"

  fetch_nmt || return "${EX_ERR}"
  fetch_platform_build || return "${EX_ERR}"

  for node_name in "${NODE_NAMES[@]}";do
    local pod="network-${node_name}-0" # pod name
    copy_nmt "${pod}" || return "${EX_ERR}"
    copy_platform "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HEDERA_HOME_DIR}" || return "${EX_ERR}"
    install_nmt "${pod}" || return "${EX_ERR}"
    nmt_preflight "${pod}" || return "${EX_ERR}"
#    nmt_install "${pod}" || return "${EX_ERR}"
#    copy_hedera_keys "${pod}" || return "${EX_ERR}"
#    copy_config_files "${pod}" || return "${EX_ERR}"
#    ls_path "${pod}" "${HAPI_PATH}/"
#    copy_node_keys "${node_name}" "${pod}" || return "${EX_ERR}"
#    ls_path "${pod}" "${HAPI_PATH}/data/keys/"
#    nmt_start "${pod}" || return "${EX_ERR}"
#    verify_network_state "${pod}" || return "${EX_ERR}"
  done
}

run_node_nmt || exit 1
