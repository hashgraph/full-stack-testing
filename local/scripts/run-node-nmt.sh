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
NMT_PROFILE=jrs

PLATFORM_TAG="${PLATFORM_RELEASE_TAG:-v0.39.1}"
PLATFORM_INSTALLER="build-${PLATFORM_TAG}.zip"
PLATFORM_INSTALLER_PATH="${SCRIPT_DIR}/build-${PLATFORM_TAG}.zip"

# Fetch NMT release
function fetch_nmt() {
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
  if [[ -f "${PLATFORM_INSTALLER_PATH}" ]];then
    echo "Found Platform installer: ${PLATFORM_INSTALLER_PATH}"
    return "${EX_OK}"
  fi

  gsutil cp "gs://hedera-platform-builds/build-${PLATFORM_TAG}.zip" "${SCRIPT_DIR}" || return "${EX_ERR}"
  return "${EX_OK}"
}

# Copy NMT into root-container
function copy_nmt() {
  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_nmt' - pod name is required"
  fi

  echo "Copying ${NMT_INSTALLER_PATH} -> ${pod}:${HEDERA_HOME_DIR}"
  kubectl cp "${NMT_INSTALLER_PATH}" "${pod}":"${HEDERA_HOME_DIR}" -c root-container || return "${EX_ERR}"

  return "${EX_OK}"
}

# Copy platform installer into root-container
function copy_platform() {
  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_platform' - pod name is required"
  fi

  echo "Copying ${PLATFORM_INSTALLER_PATH} -> ${pod}:${HEDERA_HOME_DIR}"
  kubectl cp "${PLATFORM_INSTALLER_PATH}" "${pod}":"${HEDERA_HOME_DIR}" -c root-container || return "${EX_ERR}"

  return "${EX_OK}"
}

# Copy hedera keys
function copy_hedera_keys() {
  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_hedera_keys' - pod name is required"
  fi

  local files=( \
    "${SCRIPT_DIR}/../demo-keys/hedera.key" \
    "${SCRIPT_DIR}/../demo-keys/hedera.crt" \
  )

  for file in "${files[@]}"; do
    echo "Copying ${file} -> ${pod}:${HAPI_PATH}"
    kubectl cp "$file" "${pod}":"${HAPI_PATH}" -c root-container || return "${EX_ERR}"
  done

  return "${EX_OK}"
}

# Copy node keys
function copy_node_keys() {
  local node="$1"
  if [ -z "${node}" ]; then
    echo "ERROR: 'copy_node_keys' - node name is required"
  fi

  local pod="$2"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_node_keys' - pod name is required"
  fi

  local files=( \
    "${SCRIPT_DIR}/../demo-keys/${node}/private-${node}.pfx" \
    "${SCRIPT_DIR}/../demo-keys/public.pfx" \
  )

  for file in "${files[@]}"; do
    echo "Copying ${file} -> ${pod}:${HAPI_PATH}/data/keys"
    kubectl cp "$file" "${pod}":"${HAPI_PATH}/data/keys" -c root-container || return "${EX_ERR}"
  done

  return "${EX_OK}"
}

function verify_network_state() {
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
    echo "::error title=Node Management Tools Error::The network is not operational."
    exit 67
  fi

}

function run_node_nmt() {
  if [[ "${#NODE_NAMES[*]}" -le 1 ]]; then
    echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
    return "${EX_ERR}"
  fi

  echo ""
  echo "Fetching NMT ${NMT_TAG}"
  echo "--------------------------------------------------------------"
  fetch_nmt || return "${EX_ERR}"

  echo ""
  echo "Fetching Platform ${PLATFORM_TAG}"
  echo "--------------------------------------------------------------"
  fetch_platform_build || return "${EX_ERR}"

  echo ""
  echo "Processing nodes ${NODE_NAMES[*]}"
  echo "--------------------------------------------------------------"
  for node_name in "${NODE_NAMES[@]}";do
    local pod="network-${node_name}-0" # pod name

    # copy NMT and platform code into the root container
    echo ""
    echo "Copying NMT to ${pod}"
    echo "--------------------------------------------------------------"
    copy_nmt "${pod}" || return "${EX_ERR}"

    echo ""
    echo "Copying Platform to ${pod}"
    echo "--------------------------------------------------------------"
    copy_platform "${pod}" || return "${EX_ERR}"

    echo ""
    echo "Displaying contents of ${HEDERA_HOME_DIR} from ${pod}"
    echo "--------------------------------------------------------------"
    kubectl exec "${pod}" -c root-container -- ls -al "${HEDERA_HOME_DIR}"

    # Cleanup
    echo ""
    echo "Cleanup pod directory ${HGCAPP_DIR} in ${pod}"
    echo "--------------------------------------------------------------"
    kubectl exec "${pod}" -c root-container -- bash -c "rm -rf ${HGCAPP_DIR}/*" || return "${EX_ERR}"

    # Install NMT
    echo ""
    echo "Install NMT to ${pod}"
    echo "--------------------------------------------------------------"
    kubectl exec "${pod}" -c root-container -- chmod +x "${HEDERA_HOME_DIR}/${NMT_INSTALLER}" || return "${EX_ERR}"
    kubectl exec "${pod}" -c root-container -- "${HEDERA_HOME_DIR}/${NMT_INSTALLER}" --accept -- -fg || return "${EX_ERR}"

    # Install platform software
    echo ""
    echo "Run Preflight in ${pod}"
    echo "--------------------------------------------------------------"
    kubectl exec "${pod}" -c root-container --  \
      node-mgmt-tool -VV preflight -j 17.0.2 -df -i "${NMT_PROFILE}" -k 1g -m 1g || return "${EX_ERR}"

    echo ""
    echo "Run Install in ${pod}"
    echo "--------------------------------------------------------------"
    kubectl exec "${pod}" -c root-container --  \
      node-mgmt-tool -VV install \
      -p "${HEDERA_HOME_DIR}/${PLATFORM_INSTALLER}" \
      -n "${node_name}" \
      -x "${PLATFORM_TAG}" \
      || return "${EX_ERR}"

    echo ""
    echo "Copy hedery TLS keys to ${pod}"
    echo "--------------------------------------------------------------"
    copy_hedera_keys "${pod}" || return "${EX_ERR}"

    echo ""
    echo "Displaying contents of ${HAPI_PATH} from ${pod}"
    echo "--------------------------------------------------------------"
    kubectl exec "${pod}" -c root-container -- ls -al "${HAPI_PATH}"

    echo ""
    echo "Copy node gossip keys to ${pod}"
    echo "--------------------------------------------------------------"
    copy_node_keys "${node_name}" "${pod}" || return "${EX_ERR}"

    echo ""
    echo "Displaying contents of ${HAPI_PATH}/data/keys from ${pod}"
    echo "-------------------------------------------------------------"
    kubectl exec "${pod}" -c root-container -- ls -al "${HAPI_PATH}/data/keys"

    echo ""
    echo "Starting platform in ${pod}"
    echo "-------------------------------------------------------------"
    kubectl exec "${pod}" -c root-container -- node-mgmt-tool -VV start

    echo ""
    echo "Checking logs in ${pod}"
    echo "-------------------------------------------------------------"
    verify_network_state "${pod}" || return "${EX_ERR}"
  done

}

run_node_nmt || exit 1
