#!/usr/bin/env bash
CUR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
source "${CUR_DIR}/env.sh"

# load .env file
set -a
# shellcheck source=./../temp/.env
source "${TMP_DIR}/.env"
set +a

KCTL="$(command -v kubectl)"
readonly KCTL

readonly EX_OK=0
readonly EX_ERR=1
readonly MAX_ATTEMPTS=60
readonly HGCAPP_DIR="/opt/hgcapp"
readonly NMT_DIR="${HGCAPP_DIR}/node-mgmt-tools"
readonly HAPI_PATH="${HGCAPP_DIR}/services-hedera/HapiApp2.0"
readonly HEDERA_HOME_DIR="/home/hedera"
readonly RELEASE_NAME="${RELEASE_NAME:-fst}"

readonly NMT_VERSION="${NMT_VERSION:-v2.0.0-alpha.0}"
readonly NMT_RELEASE_URL="https://api.github.com/repos/swirlds/swirlds-docker/releases/tags/${NMT_VERSION}"
readonly NMT_INSTALLER="node-mgmt-tools-installer-${NMT_VERSION}.run"
readonly NMT_INSTALLER_DIR="${SCRIPT_DIR}/../resources/nmt"
readonly NMT_INSTALLER_PATH="${NMT_INSTALLER_DIR}/${NMT_INSTALLER}"
readonly NMT_PROFILE="jrs" # we only allow jrs profile

readonly PLATFORM_VERSION="${PLATFORM_VERSION:-v0.39.1}"
readonly MINOR_VERSION=$(parse_minor_version "${PLATFORM_VERSION}")
readonly PLATFORM_INSTALLER="build-${PLATFORM_VERSION}.zip"
readonly PLATFORM_INSTALLER_DIR="${SCRIPT_DIR}/../resources/platform"
readonly PLATFORM_INSTALLER_PATH="${PLATFORM_INSTALLER_DIR}/${PLATFORM_INSTALLER}"
readonly PLATFORM_INSTALLER_URL=$(prepare_platform_software_URL "${PLATFORM_VERSION}")

readonly OPENJDK_VERSION="${OPENJDK_VERSION:-21.0.1}"

function log_time() {
  local end_time duration execution_time

  local func_name=$1

  end_time=$(date +%s)
  duration=$((end_time - start_time))
  execution_time=$(printf "%.2f seconds" "${duration}")
  echo "-----------------------------------------------------------------------------------------------------"
  echo "<<< ${func_name} execution took: ${execution_time} >>>"
  echo "-----------------------------------------------------------------------------------------------------"
}

# Fetch NMT release
function fetch_nmt() {
  echo ""
  echo "Fetching NMT ${NMT_VERSION}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [[ -f "${NMT_INSTALLER_PATH}" ]]; then
    echo "Found NMT installer: ${NMT_INSTALLER_PATH}"
    return "${EX_OK}"
  fi

  mkdir -p "${NMT_INSTALLER_DIR}"

  # fetch nmt version.properties file to find the actual release file name
  local release_dir=$(parse_release_dir "${NMT_VERSION}")
  local nmt_version_url="https://builds.hedera.com/node/mgmt-tools/${release_dir}/version.properties"
  echo "NMT version.properties URL: ${nmt_version_url}"
  curl -L "${nmt_version_url}" -o "${NMT_INSTALLER_DIR}/version.properties" || return "${EX_ERR}"
  cat "${NMT_INSTALLER_DIR}/version.properties"

  # parse version.properties file to determine the actual URL
  local nmt_release_file=$(grep "^${NMT_VERSION}" "${NMT_INSTALLER_DIR}/version.properties"|cut -d'=' -f2)
  local nmt_release_url="https://builds.hedera.com/node/mgmt-tools/${release_dir}/${nmt_release_file}"
  echo "NMT release URL: ${nmt_release_url}"
  curl -L "${nmt_release_url}" -o "${NMT_INSTALLER_PATH}" || return "${EX_ERR}"
  ls -la "${NMT_INSTALLER_DIR}"

  return "${EX_OK}"
}

# Fetch platform build.zip file
function fetch_platform_build() {
  echo ""
  echo "Fetching Platform ${PLATFORM_VERSION}: ${PLATFORM_INSTALLER_URL}"
  echo "Local path: ${PLATFORM_INSTALLER_PATH}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [[ -f "${PLATFORM_INSTALLER_PATH}" ]]; then
    echo "Found Platform installer: ${PLATFORM_INSTALLER_PATH}"
    return "${EX_OK}"
  fi

  mkdir -p "${PLATFORM_INSTALLER_DIR}"
  curl -L "${PLATFORM_INSTALLER_URL}" -o "${PLATFORM_INSTALLER_PATH}" || return "${EX_ERR}"
  return "${EX_OK}"
}

function reset_node() {
  local pod="${1}"

  echo ""
  echo "Resetting node ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

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
  local pod="${1}"

  echo ""
  echo "Copying NMT to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_nmt' - pod name is required"
    return "${EX_ERR}"
  fi

  echo "Copying ${NMT_INSTALLER_PATH} -> ${pod}:${HEDERA_HOME_DIR}"
  "${KCTL}" cp "${NMT_INSTALLER_PATH}" "${pod}":"${HEDERA_HOME_DIR}" -c root-container || return "${EX_ERR}"

  return "${EX_OK}"
}

function set_permission() {
  local pod="${1}"
  local path="${2}"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'set_permission' - pod name is required"
    return "${EX_ERR}"
  fi

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

# Copy platform installer into root-container
function copy_platform() {
  local pod="${1}"

  echo ""
  echo "Copying Platform to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_platform' - pod name is required"
    return "${EX_ERR}"
  fi

  echo "Copying ${PLATFORM_INSTALLER_PATH} -> ${pod}:${HEDERA_HOME_DIR}"
  "${KCTL}" cp "${PLATFORM_INSTALLER_PATH}" "${pod}":"${HEDERA_HOME_DIR}" -c root-container || return "${EX_ERR}"

  return "${EX_OK}"
}

# copy files and set ownership to hedera:hedera
function copy_files() {
  local pod="${1}"
  local srcDir="${2}"
  local file="${3}"
  local dstDir="${4}"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_files' - pod name is required"
    return "${EX_ERR}"
  fi
  if [ -z "${srcDir}" ]; then
    echo "ERROR: 'copy_files' - src path is required"
    return "${EX_ERR}"
  fi

  if [ -z "${file}" ]; then
    echo "ERROR: 'copy_files' - file path is required"
    return "${EX_ERR}"
  fi

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

# Copy hedera keys
function copy_hedera_keys() {
  local pod="${1}"

  echo ""
  echo "Copy hedera TLS keys to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_hedera_keys' - pod name is required"
    return "${EX_ERR}"
  fi

  local srcDir="${SCRIPT_DIR}/../local-node"
  local dstDir="${HAPI_PATH}"
  local files=(
    "hedera.key"
    "hedera.crt"
  )

  for file in "${files[@]}"; do
    copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"
  done

  return "${EX_OK}"
}

# Copy node keys
function copy_node_keys() {
  local node="${1}"

  echo ""
  echo "Copy node gossip keys to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${node}" ]; then
    echo "ERROR: 'copy_node_keys' - node name is required"
    return "${EX_ERR}"
  fi

  local pod="$2"
  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_node_keys' - pod name is required"
    return "${EX_ERR}"
  fi

  local srcDir="${SCRIPT_DIR}/../local-node/data/keys"
  local dstDir="${HAPI_PATH}/data/keys"
  local files=(
    "private-${node}.pfx"
    "public.pfx"
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
  echo "Platform version: ${PLATFORM_VERSION}"
  echo "Minor version: ${MINOR_VERSION}"
  echo "-----------------------------------------------------------------------------------------------------"

  local config_file="${TMP_DIR}/config.txt"
  local node_IP=""
  local node_seq="${NODE_SEQ:-0}" # this also used as the account ID suffix
  local account_id_prefix="${ACCOUNT_ID_PREFIX:-0.0}"
  local account_id_seq="${ACCOUNT_ID_SEQ:-3}"
  local internal_port="${INTERNAL_GOSSIP_PORT:-50111}"
  local external_port="${EXTERNAL_GOSSIP_PORT:-50111}"
  local ledger_name="${LEDGER_NAME:-123}"
  local app_jar_file="${APP_NAME:-HederaNode.jar}"
  local node_stake="${NODE_DEFAULT_STAKE:-1}"

  # prepare config lines
  local config_lines=()
  config_lines+=("swirld, ${ledger_name}")
  config_lines+=("app, ${app_jar_file}")

  # prepare address book lines
  local addresses=()
  for node_name in "${NODE_NAMES[@]}"; do
    local pod="network-${node_name}-0" # pod name
    local max_attempts=$MAX_ATTEMPTS
    local attempts=0
    local status=$(kubectl get pod "${pod}" -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}')

    while [[ "${attempts}" -lt "${max_attempts}" &&  "${status}" != "True" ]]; do
      kubectl get pod "${pod}" -o 'jsonpath={..status.conditions[?(@.type=="Ready")]}'

      echo ""
      echo "Waiting for the pod to be ready - ${pod}: Attempt# ${attempts}/${max_attempts} ..."
      sleep 5

      status=$(kubectl get pod "${pod}" -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}')
      attempts=$((attempts + 1))
    done

    echo "${KCTL} get pod ${pod} -o jsonpath='{.status.podIP}' | xargs"
    local POD_IP=$("${KCTL}" get pod "${pod}" -o jsonpath='{.status.podIP}' | xargs)
    if [ -z "${POD_IP}" ]; then
      echo "Could not detect pod IP for ${pod}"
      return "${EX_ERR}"
    fi

    echo "${KCTL} get svc network-${node_name}-svc -o jsonpath='{.spec.clusterIP}' | xargs"
    local SVC_IP=$("${KCTL}" get svc "network-${node_name}-svc" -o jsonpath='{.spec.clusterIP}' | xargs)
    if [ -z "${SVC_IP}" ]; then
      echo "Could not detect service IP for ${pod}"
      return "${EX_ERR}"
    fi

    echo "pod IP: ${POD_IP}, svc IP: ${SVC_IP}"

    local account="${account_id_prefix}.${account_id_seq}"
    local internal_ip="${POD_IP}"
    local external_ip="${SVC_IP}"

    # for v.40.* onward
    if [[ "${MINOR_VERSION}" -ge "40" ]]; then
      local node_nick_name="${node_name}"
      config_lines+=("address, ${node_seq}, ${node_nick_name}, ${node_name}, ${node_stake}, ${internal_ip}, ${internal_port}, ${external_ip}, ${external_port}, ${account}")
    else
      config_lines+=("address, ${node_seq}, ${node_name}, ${node_stake}, ${internal_ip}, ${internal_port}, ${external_ip}, ${external_port}, ${account}")
    fi

    # increment node id
    node_seq=$((node_seq + 1))
    account_id_seq=$((account_id_seq + 1))
  done

  # for v.41.* onward
  if [[ "${MINOR_VERSION}" -ge "41" ]]; then
    config_lines+=("nextNodeId, ${node_seq}")
  fi

  # write contents to config file
  cp "${SCRIPT_DIR}/../local-node/config.template" "${config_file}" || return "${EX_ERR}"
  for line in "${config_lines[@]}"; do
    echo "${line}" >>"${config_file}" || return "${EX_ERR}"
  done

  # display config file contents
  echo ""
  cat "${TMP_DIR}/config.txt" || return "${EX_ERR}"

  return "${EX_OK}"
}

# Copy config files
function copy_config_files() {
  local node="${1}"
  local pod="${2}"

  echo ""
  echo "Copy config to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${node}" ]; then
    echo "ERROR: 'copy_config_files' - node name is required"
    return "${EX_ERR}"
  fi

  if [ -z "${pod}" ]; then
    echo "ERROR: 'copy_config_files' - pod name is required"
    return "${EX_ERR}"
  fi

  # copy the correct log42j file locally before copying into the container
  local srcDir="${TMP_DIR}"
  local dstDir="${HAPI_PATH}"
  cp -f "${SCRIPT_DIR}/../local-node/log4j2-${NMT_PROFILE}.xml" "${TMP_DIR}/log4j2.xml" || return "${EX_ERR}"
  local files=(
    "config.txt"
    "log4j2.xml"
  )
  for file in "${files[@]}"; do
    copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"
  done

  # copy files into the containers
  local srcDir="${SCRIPT_DIR}/../local-node"
  local files=(
    "settings.txt"
  )
  for file in "${files[@]}"; do
    copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"
  done

  # copy config properties files
  local srcDir="${SCRIPT_DIR}/../local-node/data/config"
  local dstDir="${HAPI_PATH}/data/config"
  local files=(
    "api-permission.properties"
    "application.properties"
    "bootstrap.properties"
  )

  for file in "${files[@]}"; do
    copy_files "${pod}" "${srcDir}" "${file}" "${dstDir}" || return "${EX_ERR}"
  done

  # create gc.log file since otherwise node doesn't start when using older NMT releases (e.g. v1.2.2)
  "${KCTL}" exec  "${pod}" -c root-container -- touch "${HAPI_PATH}/gc.log" || return "${EX_ERR}"
  set_permission "${pod}" "${HAPI_PATH}/gc.log"



  return "${EX_OK}"
}

function ls_path() {
  local pod="${1}"
  local path="${2}"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'ls_path' - pod name is required"
    return "${EX_ERR}"
  fi

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
  local pod="${1}"
  local path="${2}"

  echo ""
  echo "Cleanup pod directory ${HGCAPP_DIR} in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'cleanup_path' - pod name is required"
    return "${EX_ERR}"
  fi

  if [ -z "${path}" ]; then
    echo "ERROR: 'ls_path' - path is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container -- bash -c "rm -rf ${path}" || return "${EX_ERR}"
  return "${EX_OK}"
}

function install_nmt() {
  local pod="${1}"

  echo ""
  echo "Install NMT to ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'install_nmt' - pod name is required"
    return "${EX_ERR}"
  fi

  # do not call rm directoires for nmt install
  # cleanup_path "${pod}" "${HGCAPP_DIR}/*" || return "${EX_ERR}"
  "${KCTL}" exec "${pod}" -c root-container -- chmod +x "${HEDERA_HOME_DIR}/${NMT_INSTALLER}" || return "${EX_ERR}"
  "${KCTL}" exec "${pod}" -c root-container -- sudo "${HEDERA_HOME_DIR}/${NMT_INSTALLER}" --accept -- -fg || return "${EX_ERR}"

  return "${EX_OK}"
}

function nmt_preflight() {
  local pod="${1}"

  echo ""
  echo "Run Preflight in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'nmt_preflight' - pod name is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container -- \
    node-mgmt-tool -VV preflight -j "${OPENJDK_VERSION}" -df -i "${NMT_PROFILE}" -k 256m -m 512m || return "${EX_ERR}"

  return "${EX_OK}"
}

function nmt_install() {
  local pod="${1}"

  echo ""
  echo "Run Install in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'nmt_install' - pod name is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container -- \
    node-mgmt-tool -VV install \
    -p "${HEDERA_HOME_DIR}/${PLATFORM_INSTALLER}" \
    -n "${node_name}" \
    -x "${PLATFORM_VERSION}" ||
    return "${EX_ERR}"

  "${KCTL}" exec "${pod}" -c root-container -- \
    docker images && docker ps -a

  return "${EX_OK}"
}

function nmt_start() {
  local pod="${1}"

  echo ""
  echo "Starting platform node in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'nmt_start' - pod name is required"
    return "${EX_ERR}"
  fi

  # remove old logs
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "rm -f ${HAPI_PATH}/logs/*" || true

  "${KCTL}" exec "${pod}" -c root-container -- node-mgmt-tool -VV start || return "${EX_ERR}"

  local attempts=0
  local max_attempts=$MAX_ATTEMPTS
  local status=$("${KCTL}" exec "${pod}" -c root-container -- docker ps -q)
  while [[ "${attempts}" -lt "${max_attempts}" && "${status}" = "" ]]; do
    echo ">> Waiting 5s to let the containers start ${pod}: Attempt# ${attempts}/${max_attempts} ..."
    sleep 5

    "${KCTL}" exec "${pod}" -c root-container -- docker ps || return "${EX_ERR}"

    status=$("${KCTL}" exec "${pod}" -c root-container -- docker ps -q)
    attempts=$((attempts + 1))
  done

  if [[ -z "${status}" ]]; then
    echo "ERROR: Containers didn't start"
    return "${EX_ERR}"
  fi

  sleep 20
  echo "Containers started..."
  "${KCTL}" exec "${pod}" -c root-container -- docker ps -a || return "${EX_ERR}"
  sleep 10

  local podState podStateErr
  podState="$("${KCTL}" exec "${pod}" -c root-container -- docker ps -a -f 'name=swirlds-node' --format '{{.State}}')"
  podStateErr="${?}"

  if [[ "${podStateErr}" -ne 0 || -z "${podState}" || "${podState}" != "running" ]]; then
    echo "ERROR: 'nmt_start' - swirlds-node container is not running"
    return "${EX_ERR}"
  fi

  echo "Fetching logs from swirlds-haveged..."

  "${KCTL}" exec "${pod}" -c root-container -- docker logs --tail 10 swirlds-haveged || return "${EX_ERR}"

  echo "Fetching logs from swirlds-node..."
  "${KCTL}" exec "${pod}" -c root-container -- docker logs --tail 10 swirlds-node  || return "${EX_ERR}"

  return "${EX_OK}"
}

function nmt_stop() {
  local pod="${1}"

  echo ""
  echo "Stopping platform node in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  if [ -z "${pod}" ]; then
    echo "ERROR: 'nmt_stop' - pod name is required"
    return "${EX_ERR}"
  fi

  "${KCTL}" exec "${pod}" -c root-container -- node-mgmt-tool -VV stop || return "${EX_ERR}"

  # cleanup
  echo "Waiting 15s to let the containers stop..."
  sleep 15
  "${KCTL}" exec "${pod}" -c root-container -- docker ps -a || return "${EX_ERR}"
  echo "Removing containers..."
  #  "${KCTL}" exec "${pod}" -c root-container -- bash -c "docker stop \$(docker ps -aq)" || true
  "${KCTL}" exec "${pod}" -c root-container -- bash -c "docker rm -f \$(docker ps -aq)" || true
  "${KCTL}" exec "${pod}" -c root-container -- docker ps -a || return "${EX_ERR}"

  return "${EX_OK}"
}

function verify_network_state() {
  local pod="${1}"
  local max_attempts="${2}"

  echo ""
  echo "Checking network status in ${pod}"
  echo "-----------------------------------------------------------------------------------------------------"

  local attempts=0
  local status=""

  local LOG_PATH="${HAPI_PATH}/logs/hgcaa.log"
  local status_pattern="ACTIVE"

  while [[ "${attempts}" -lt "${max_attempts}" && "${status}" != *"${status_pattern}"* ]]; do
    sleep 5

    attempts=$((attempts + 1))

    echo "====================== ${pod}: Attempt# ${attempts}/${max_attempts} ==================================="

    set +e
    status="$("${KCTL}" exec "${pod}" -c root-container -- cat "${LOG_PATH}" | grep "${status_pattern}")"
    set -e

    if [[ "${status}" != *"${status_pattern}"* ]]; then
      "${KCTL}" exec "${pod}" -c root-container -- ls -la "${HAPI_PATH}/logs"

      # show swirlds.log to see what node is doing
      "${KCTL}" exec "${pod}" -c root-container -- tail -n 5 "${HAPI_PATH}/logs/swirlds.log"
    else
      echo "${status}"
    fi
  done

  if [[ "${status}" != *"${status_pattern}"* ]]; then
    # capture the docker log in a local file for investigation
    "${KCTL}" exec "${pod}" -c root-container -- docker logs swirlds-node >"${TMP_DIR}/${pod}-swirlds-node.log"

    echo "ERROR: <<< The network is not operational in ${pod}. >>>"
    return "${EX_ERR}"
  fi

  echo "====================== ${pod}: Status check complete ==================================="
  return "$EX_OK"
}

function verify_haproxy() {
  # iterate over each haprox pod check if READY is 1/1
  local pods=$("${KCTL}" get pods -l fullstack.hedera.com/type=haproxy -o jsonpath='{.items[*].metadata.name}')
  for pod in ${pods}; do
    local status=$("${KCTL}" get pod "${pod}" -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}')
    if [[ "${status}" != "True" ]]; then
      echo "ERROR: <<< HAProxy pod ${pod} is not ready. >>>"
      return "${EX_ERR}"
    fi
    echo "HAProxy pod ${pod} is ready"
  done
  return "${EX_OK}"
}

function verify_node_all() {
  if [[ "${#NODE_NAMES[*]}" -le 0 ]]; then
    echo "ERROR: Node list is empty. Set NODE_NAMES env variable with a list of nodes"
    return "${EX_ERR}"
  fi
  echo ""
  echo "Verifying node status ${NODE_NAMES[*]} ${#NODE_NAMES[@]}"
  echo "-----------------------------------------------------------------------------------------------------"

  local node_name
  for node_name in "${NODE_NAMES[@]}"; do
    local pod="network-${node_name}-0" # pod name
    verify_network_state "${pod}" "${MAX_ATTEMPTS}" || return "${EX_ERR}"
    log_time "verify_network_state"
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

  local node_name
  for node_name in "${NODE_NAMES[@]}"; do
    local pod="network-${node_name}-0" # pod name
    copy_hedera_keys "${pod}" || return "${EX_ERR}"
    copy_node_keys "${node_name}" "${pod}" || return "${EX_ERR}"
    log_time "replace_keys"
  done

  return "${EX_OK}"
}

function reset_node_all() {
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
    reset_node "${pod}" || return "${EX_ERR}"
    log_time "reset_node"
  done

  return "${EX_OK}"
}
