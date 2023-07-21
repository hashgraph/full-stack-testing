#!/usr/bin/env bash
start_time=$(date +%s.%N)
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# load .env file
set -a
source ".env"
set +a

KCTL=/usr/local/bin/kubectl

EX_OK=0
EX_ERR=1
MAX_ATTEMPTS=10
HGCAPP_DIR="/opt/hgcapp"
NMT_DIR="${HGCAPP_DIR}/node-mgmt-tools"
HAPI_PATH="${HGCAPP_DIR}/services-hedera/HapiApp2.0"
HEDERA_HOME_DIR="/home/hedera"
NODE_NAMES="${NODE_NAMES}"

NMT_VERSION="${NMT_RELEASE_TAG:-v2.0.0-alpha.0}"
NMT_RELEASE_URL="https://api.github.com/repos/swirlds/swirlds-docker/releases/tags/${NMT_VERSION}"
NMT_INSTALLER="node-mgmt-tools-installer-${NMT_VERSION}.run"
NMT_INSTALLER_DIR="${SCRIPT_DIR}/../resources/nmt"
NMT_INSTALLER_PATH="${NMT_INSTALLER_DIR}/${NMT_INSTALLER}"
NMT_PROFILE=${NMT_PROFILE:-jrs}

PLATFORM_VERSION="${PLATFORM_RELEASE_TAG:-v0.39.1}"
PLATFORM_INSTALLER="build-${PLATFORM_VERSION}.zip"
PLATFORM_INSTALLER_DIR="${SCRIPT_DIR}/../resources/platform"
PLATFORM_INSTALLER_PATH="${PLATFORM_INSTALLER_DIR}/${PLATFORM_INSTALLER}"

OPENJDK_VERSION="${OPENJDK_VERSION:-17.0.2}"
OPENJDK_INSTALLER="openjdk-${OPENJDK_VERSION}_linux-x64_bin.tar.gz"
OPENJDK_INSTALLER_DIR="${SCRIPT_DIR}/../resources/jdk"
OPENJDK_INSTALLER_PATH="${OPENJDK_INSTALLER_DIR}/${OPENJDK_INSTALLER}"

function log_time() {
  duration=$(echo "$(date +%s.%N) - ${start_time}" | bc)
  execution_time=$(printf "%.2f seconds" "${duration}")
  echo "<<< Script Execution Time: ${execution_time} >>>"
}

# Fetch NMT release
function fetch_nmt() {
  echo ""
  echo "Fetching NMT ${NMT_VERSION}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [[ -f "${NMT_INSTALLER_PATH}" ]];then
    echo "Found NMT installer: ${NMT_INSTALLER_PATH}"
    return "${EX_OK}"
  fi

#  echo "NMT Release URL: ${NMT_RELEASE_URL}"
#  NMT_DOWNLOAD_URL=$(curl -sL \
#                       -H "Accept: application/vnd.github+json" \
#                       -H "Authorization: Bearer ${GITHUB_TOKEN}"\
#                       -H "X-GitHub-Api-Version: 2022-11-28" \
#                    "${NMT_RELEASE_URL}" | jq ".assets[0] | .url" | sed 's/\"//g')
#  echo "NMT Download URL: ${NMT_DOWNLOAD_URL}"
#  echo "Downloading NMT..."
#  curl -L \
#    -H 'Accept: application/octet-stream' \
#    -H "Authorization: Bearer ${GITHUB_TOKEN}"\
#    -H "X-GitHub-Api-Version: 2022-11-28" \
#    "${NMT_DOWNLOAD_URL}" -o "${NMT_INSTALLER_PATH}" || return "${EX_ERR}"

  gsutil cp "gs://fst-resources/nmt/${NMT_INSTALLER}" "${NMT_INSTALLER_PATH}" || return "${EX_ERR}"
  return "${EX_OK}"
}

# Fetch platform build.zip file
function fetch_platform_build() {
  echo ""
  echo "Fetching Platform ${PLATFORM_VERSION}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [[ -f "${PLATFORM_INSTALLER_PATH}" ]];then
    echo "Found Platform installer: ${PLATFORM_INSTALLER_PATH}"
    return "${EX_OK}"
  fi

  gsutil cp "gs://fst-resources/platform/${PLATFORM_INSTALLER}" "${PLATFORM_INSTALLER_PATH}" || return "${EX_ERR}"
  return "${EX_OK}"
}

# Fetch OPENJDK
function fetch_jdk() {
  echo ""
  echo "Fetching OPENJDK ${OPENJDK_INSTALLER}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [[ -f "${OPENJDK_INSTALLER_PATH}" ]];then
    echo "Found OPENJDK installer: ${OPENJDK_INSTALLER_PATH}"
    return "${EX_OK}"
  fi

  gsutil cp "gs://fst-resources/jdk/${OPENJDK_INSTALLER}" "${OPENJDK_INSTALLER_PATH}" || return "${EX_ERR}"
  return "${EX_OK}"
}

function reset_node() {
  echo ""
  echo "Resetting node ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'reset_nmt' - pod name is required"
    return "${EX_ERR}"
  fi

  # best effort clean up of docker env
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "docker stop \$(docker ps -aq)" || true
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "docker rm -f \$(docker ps -aq)" || true
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "docker rmi -f \$(docker images -aq)" || true

  "${KCTL}" exec "${pod}" -c root-container -- rm -rf "${NMT_DIR}" || true
  "${KCTL}" exec "${pod}" -c root-container -- rm -rf "${HAPI_PATH}" || true

  ls_path "${pod}" "${HGCAPP_DIR}"
  set_permission "${pod}" "${HGCAPP_DIR}"

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
  "${KCTL}" cp "${NMT_INSTALLER_PATH}" "${pod}":"${HEDERA_HOME_DIR}" -c root-container || return "${EX_ERR}"

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
  "${KCTL}" cp "${PLATFORM_INSTALLER_PATH}" "${pod}":"${HEDERA_HOME_DIR}" -c root-container || return "${EX_ERR}"

  return "${EX_OK}"
}

function set_permission() {
  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'set_permission' - pod name is required"
    return "${EX_ERR}"
  fi

  local path="$2"
  if [ -z "${path}" ]; then
    echo "ERROR: 'set_permission' - path is required"
    return "${EX_ERR}"
  fi

  local mode=0755

  echo "Changing ownership of ${pod}:${path}"
  "${KCTL}" exec "${pod}" -c root-container -- chown -R hedera:hedera "${path}" || return "${EX_ERR}"

  echo "Changing permission to ${mode} of ${pod}:${path}"
  "${KCTL}" exec "${pod}" -c root-container -- chmod -R "${mode}" "${path}" || return "${EX_ERR}"

  echo ""
  ls_path "${pod}" "${path}"

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

  echo ""
  echo "Copying ${srcDir}/${file} -> ${pod}:${dstDir}/"
  "${KCTL}" cp "$srcDir/${file}" "${pod}:${dstDir}/" -c root-container || return "${EX_ERR}"

  set_permission "${pod}" "${dstDir}/${file}"

  return "${EX_OK}"
}

# Copy OPENJDK installer into root-container's node-mgmt-tools directory
function copy_jdk() {
  echo ""
  echo "Copying OPENJDK to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_platform' - pod name is required"
    return "${EX_ERR}"
  fi

  local srcDir="${SCRIPT_DIR}/../resources/jdk"
  local file="${OPENJDK_INSTALLER}"
  local dstDir="${HGCAPP_DIR}/node-mgmt-tools/images/network-node-base"
  copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"

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

# prepare address book using all nodes pod IP and store as config.txt
function prep_address_book() {
  echo ""
  echo "Preparing address book"
  echo "-----------------------------------------------------------------------------------------------------"

  cp "${SCRIPT_DIR}/../network-node/config.template" "${SCRIPT_DIR}/../network-node/config.txt"

  local node_IP=""
  local node_id=0
  local internal_port=50211
  local external_port=50211
  for node_name in "${NODE_NAMES[@]}";do
    local pod="network-${node_name}-0" # pod name
    echo "${KCTL} get pod ${pod} -o jsonpath='{.status.podIP}' | xargs"
    POD_IP=$("${KCTL}" get pod "${pod}" -o jsonpath='{.status.podIP}' | xargs)
    if [ -z "${POD_IP}" ]; then
      echo "Could not detect pod IP for ${pod}"
      return "${EX_ERR}"
    fi

    echo "pod IP: ${POD_IP}"

    # render template
    local account="0.0.${node_id}"
    local internal_ip="${POD_IP}"
    local external_ip="${POD_IP}"
    local node_stake=1
    echo "address, ${node_id}, ${node_name}, ${node_stake}, ${internal_ip}, ${internal_port}, ${external_ip}, ${external_port}, ${account}" >> "${SCRIPT_DIR}/../network-node/config.txt"
#    node_ip="${node_name}_IP"
#    echo "${node_IP}: ${POD_IP}"
#    echo "${node_IP}=${POD_IP} envsubst '\$${node_IP}' < ${SCRIPT_DIR}/../network-node/config.txt"
#    config_content=$(bash -c "${node_IP}=${POD_IP} envsubst '\$${node_IP}' < ${SCRIPT_DIR}/../network-node/config.txt")
#    echo "${config_content}" > "${SCRIPT_DIR}/../network-node/config.txt"

     # increment node id
     node_id=$((node_id+1))
  done

  echo ""
  cat "${SCRIPT_DIR}/../network-node/config.txt"

  return "${EX_OK}"
}

# Copy config files
function copy_config_files() {
  echo ""
  echo "Copy config to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local node="$1"
  if [ -z "${node}" ]; then
    echo "ERROR: 'copy_config_files' - node name is required"
    return "${EX_ERR}"
  fi

  local pod="$2"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_config_files' - pod name is required"
    return "${EX_ERR}"
  fi

  local srcDir="${SCRIPT_DIR}/../network-node"
  local dstDir="${HAPI_PATH}"
  local files=( \
    "config.txt" \
    "settings.txt" \
    "log4j2.xml"
  )

  for file in "${files[@]}"; do
    copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"
  done

  local srcDir="${SCRIPT_DIR}/../network-node/data/config"
  local dstDir="${HAPI_PATH}/data/config"
  local files=( \
    "api-permission.properties" \
    "application.properties" \
    "bootstrap.properties" \
  )

  for file in "${files[@]}"; do
    copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"
  done

  return "${EX_OK}"
}


# Copy docker files
function copy_docker_files() {
  echo ""
  echo "Copy docker files to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_docker_files' - pod name is required"
    return "${EX_ERR}"
  fi

  local srcDir="${SCRIPT_DIR}/../resources/images/main-network-node"
  local dstDir="${NMT_DIR}/images/main-network-node"
  copy_files "${pod}" "${srcDir}" "Dockerfile" "${dstDir}" || return "${EX_ERR}"

  local srcDir="${SCRIPT_DIR}/../resources/images/network-node-base"
  local dstDir="${NMT_DIR}/images/network-node-base"
  copy_files "${pod}" "${srcDir}" "Dockerfile" "${dstDir}" || return "${EX_ERR}"

  return "${EX_OK}"
}

function ls_path() {
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

  echo ""
  echo "Displaying contents of ${path} from ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  echo "Running: "${KCTL}" exec ${pod} -c root-container -- ls -al ${path}"
  "${KCTL}" exec "${pod}" -c root-container -- ls -al "${path}"
}

function cleanup_path() {
  echo ""
  echo "Cleanup pod directory ${HGCAPP_DIR} in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'cleanup_path' - pod name is required"
    return "${EX_ERR}"
  fi

  local path="$2"
  if [ -z "${path}" ]; then
    echo "ERROR: 'ls_path' - path is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container -- bash -c "rm -rf ${path}" || return "${EX_ERR}"
  return "${EX_OK}"
}

function install_nmt() {
  echo ""
  echo "Install NMT to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'install_nmt' - pod name is required"
    return "${EX_ERR}"
  fi

  cleanup_path "${pod}" "${HGCAPP_DIR}/*" || return "${EX_ERR}"
  "${KCTL}" exec "${pod}" -c root-container -- chmod +x "${HEDERA_HOME_DIR}/${NMT_INSTALLER}" || return "${EX_ERR}"
  "${KCTL}" exec "${pod}" -c root-container -- sudo "${HEDERA_HOME_DIR}/${NMT_INSTALLER}" --accept -- -fg || return "${EX_ERR}"

  return "${EX_OK}"
}

function nmt_preflight() {
  echo ""
  echo "Run Preflight in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'nmt_preflight' - pod name is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container --  \
    node-mgmt-tool -VV preflight -j "${OPENJDK_VERSION}" -df -i "${NMT_PROFILE}" -k 1g -m 1g || return "${EX_ERR}"

  return "${EX_OK}"
}

function nmt_install() {
  echo ""
  echo "Run Install in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'nmt_install' - pod name is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container --  \
    node-mgmt-tool -VV install \
    -p "${HEDERA_HOME_DIR}/${PLATFORM_INSTALLER}" \
    -n "${node_name}" \
    -x "${PLATFORM_VERSION}" \
    || return "${EX_ERR}"

  "${KCTL}" exec "${pod}" -c root-container --  \
    docker images && docker ps -a

  return "${EX_OK}"
}

function nmt_start() {
  echo ""
  echo "Starting platform node in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'nmt_start' - pod name is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container -- node-mgmt-tool -VV start || return "${EX_ERR}"
  return "${EX_OK}"
}

function nmt_stop() {
  echo ""
  echo "Stopping platform node in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'nmt_stop' - pod name is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container -- node-mgmt-tool -VV stop  || return "${EX_ERR}"
  return "${EX_OK}"
}

function verify_network_state() {
  echo ""
  echo "Checking network status in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local pod="$1"
  local max_attempts="$2"
  sleep 5
  local attempts=0
  local status=""

  LOG_PATH="output/hgcaa.log"
  [[ "${NMT_PROFILE}" == jrs* ]] && LOG_PATH="logs/stdout.log"

  while [[ "${attempts}" -lt "${max_attempts}" && "${status}" != *ACTIVE* ]]; do
    sleep 10
    attempts=$((attempts + 1))
    set +e
    status="$("${KCTL}" exec "${pod}" -c root-container -- docker logs swirlds-node | grep "Now current platform status = ACTIVE")"
    set -e
    printf "Network status in ${pod} (Attempt #${attempts})... >>>>>\n %s\n <<<<<\n" "${status}"
  done

  if [[ "${status}" != *ACTIVE* ]]; then
    "${KCTL}" exec "${pod}" -c root-container -- docker logs swirlds-node > "${pod}-swirlds-node.log"
    echo "ERROR: <<< The network is not operational in ${pod}. >>>"
    return "${EX_ERR}"
  fi

  return "$EX_OK"
}

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
  fetch_jdk || return "${EX_ERR}"
  prep_address_book || return "${EX_ERR}"

  for node_name in "${NODE_NAMES[@]}";do
    local pod="network-${node_name}-0" # pod name
    reset_node "${pod}"
    copy_nmt "${pod}" || return "${EX_ERR}"
    copy_platform "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HEDERA_HOME_DIR}" || return "${EX_ERR}"
    install_nmt "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HGCAPP_DIR}" || return "${EX_ERR}"
    nmt_preflight "${pod}" || return "${EX_ERR}"
    #set_permission "${pod}" "${HGCAPP_DIR}"
    copy_jdk "${pod}" || return "${EX_ERR}"
    copy_docker_files "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${NMT_DIR}/images/main-network-node/" || return "${EX_ERR}"
    ls_path "${pod}" "${NMT_DIR}/images/network-node-base/" || return "${EX_ERR}"
    nmt_install "${pod}" || return "${EX_ERR}"
    copy_hedera_keys "${pod}" || return "${EX_ERR}"
    copy_config_files "${node_name}" "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HAPI_PATH}/"
    copy_node_keys "${node_name}" "${pod}" || return "${EX_ERR}"
    ls_path "${pod}" "${HAPI_PATH}/data/keys/"
    log_time
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

  for node_name in "${NODE_NAMES[@]}";do
    local pod="network-${node_name}-0" # pod name
    nmt_start "${pod}" || return "${EX_ERR}"
    log_time
    verify_network_state "${pod}" "${MAX_ATTEMPTS}" || return "${EX_ERR}"
    log_time
  done

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

  for node_name in "${NODE_NAMES[@]}";do
    local pod="network-${node_name}-0" # pod name
    nmt_stop "${pod}" || return "${EX_ERR}"
    log_time
  done

  return "${EX_OK}"
}

function verify_node_all() {
  if [[ "${#NODE_NAMES[*]}" -le 0 ]]; then
    echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
    return "${EX_ERR}"
  fi
  echo ""
  echo "Processing nodes ${NODE_NAMES[*]} ${#NODE_NAMES[@]}"
  echo "-----------------------------------------------------------------------------------------------------"

  for node_name in "${NODE_NAMES[@]}";do
    local pod="network-${node_name}-0" # pod name
    verify_network_state "${pod}" "${MAX_ATTEMPTS}"
    log_time
  done

  return "${EX_OK}"
}


# copy all node keys
function replace_keys_all() {
  if [[ "${#NODE_NAMES[*]}" -le 0 ]]; then
    echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
    return "${EX_ERR}"
  fi
  echo ""
  echo "Processing nodes ${NODE_NAMES[*]} ${#NODE_NAMES[@]}"
  echo "-----------------------------------------------------------------------------------------------------"

  for node_name in "${NODE_NAMES[@]}";do
    local pod="network-${node_name}-0" # pod name
    copy_hedera_keys "${pod}" || return "${EX_ERR}"
    copy_node_keys "${node_name}" "${pod}" || return "${EX_ERR}"
    log_time
  done

  return "${EX_OK}"
}
function reset_nodes() {
  if [[ "${#NODE_NAMES[*]}" -le 0 ]]; then
    echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
    return "${EX_ERR}"
  fi
  echo ""
  echo "Processing nodes ${NODE_NAMES[*]} ${#NODE_NAMES[@]}"
  echo "-----------------------------------------------------------------------------------------------------"

  for node_name in "${NODE_NAMES[@]}";do
    local pod="network-${node_name}-0" # pod name
    reset_node "${pod}" || return "${EX_ERR}"
    log_time
  done

  return "${EX_OK}"
}