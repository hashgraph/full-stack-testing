# bats file_tags=deployment-test
setup() {
    source "$(dirname "${BATS_TEST_FILENAME}")/env.sh"
    source "${TESTS_DIR}/load.sh"
}

@test "Check all network node pods are running" {
  log_debug "----------------------------------------------------------------------------"
  log_debug "TEST: Checking total number of network node containers"
  log_debug "Expected total nodes: ${TOTAL_NODES}"
  log_debug "----------------------------------------------------------------------------"

  log_debug "Waiting for network node pods to be phase=running..."
  kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l fullstack.hedera.com/type=network-node --timeout=300s -n "${NAMESPACE}" || return "${EX_ERR}"
  log_debug "Waiting for network node pods to be condition=ready..."
  kubectl wait --for=condition=ready pod -l fullstack.hedera.com/type=network-node --timeout=300s -n "${NAMESPACE}" || return "${EX_ERR}"

  local resp="$(get_pod_list network-node)"
  local nodes=(${resp}) # convert into an array

  log_debug "Nodes: " "${nodes[@]}"
  local node_total=${#nodes[@]}

  local test_status="${FAIL}"
  if [[ "${node_total}" -eq "${TOTAL_NODES}" ]]; then
    test_status="${PASS}"
  fi

  log_debug ""
  log_debug "[${test_status}] Total network node: ${node_total}; expected: ${TOTAL_NODES}"
  log_debug ""

  # assert success
  [[ "${test_status}" = "${PASS}" ]]
}

@test "Check systemctl is running in all root containers" {
  local resp="$(get_pod_list network-node)"
  local nodes=(${resp}) # convert into an array

  log_debug "---------------------------------------------------------------------------"
  log_debug "TEST: Checking systemctl is running in all network node containers"
  log_debug "---------------------------------------------------------------------------"

  local attempts=0
  local systemctl_status="${FAIL}"
  local MAX_ATTEMPTS=10

  for node in "${nodes[@]}"
  do
    attempts=0
    systemctl_status="${EX_ERR}"

    log_debug "Checking node ${node}..."

    # make few attempts to check systemctl status
    while [[ "${attempts}" -lt "${MAX_ATTEMPTS}" && "${systemctl_status}" -ne "${EX_OK}" ]]; do
      attempts=$((attempts + 1))
      kubectl exec "${node}" -c root-container -n "${NAMESPACE}" -- systemctl status --no-pager
      systemctl_status="${?}"
      log_debug "Checked systemctl status in ${node} (Attempt #${attempts}/${MAX_ATTEMPTS})... >>>>> status: ${systemctl_status} <<<<<"
      if [[ "${systemctl_status}" -ne "${EX_OK}" ]]; then
        log_debug "Sleeping 5s..."
        sleep 5
      fi
    done

    if [[ "${systemctl_status}" -ne "${EX_OK}" ]]; then
      log_fail "systemctl is not running in node ${node}"
      break # break at first node error
    fi

    log_pass "systemctl is running in node ${node}"
  done

  local test_status="${FAIL}"
  if [[ "${systemctl_status}" -eq "${EX_OK}" ]]; then
    test_status="${PASS}"
  fi

  log_debug ""
  log_debug "[${test_status}] systemctl is running in all network node containers"
  log_debug ""

  # assert success
  [[ "${test_status}" = "${PASS}" ]]
}
