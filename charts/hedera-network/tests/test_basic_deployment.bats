setup() {
    # Define mandatory global variables. All bats file must initialize these.
    # Warning: these are also defined in run.sh. So if changes are needed, it will need to be changed at all places.
    BATS_HOME="${BATS_HOME:-../../../dev/bats}"
    TESTS_DIR="${TESTS_DIR:-.}"

    echo "*** Running tests from: ${TESTS_DIR} ***"
    source "${TESTS_DIR}/include.sh"
}

teardown() {
  echo "*** Finished running tests ***"
}

function test_node_total() {
  # set test expectations

  echo "----------------------------------------------------------------------------"
  echo "Test case: test_node_total"
  echo "Checking total number of network node containers"
  echo "Expected total nodes: ${TOTAL_NODES}"
  echo "----------------------------------------------------------------------------"

  kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l fullstack.hedera.com/type=network-node --timeout=300s || return "${EX_ERR}"

  local resp="$(get_pod_list network-node)"
  local nodes=(${resp}) # convert into an array

  echo "Nodes: " "${nodes[@]}"
  local node_total=${#nodes[@]}

  local status="${FAIL}"
  if [[ "${node_total}" -eq "${TOTAL_NODES}" ]]; then
    status="${PASS}"
  fi

  echo ""
  echo "[${status}] Total network node: ${node_total}; expected: ${TOTAL_NODES}"
  echo ""

  if [[ "${status}" = "${FAIL}" ]]; then
    return "${EX_ERR}"
  fi

  return "${EX_OK}"
}

function test_systemctl() {
  local resp="$(get_pod_list network-node)"
  local nodes=(${resp}) # convert into an array

  echo "---------------------------------------------------------------------------"
  echo "Test case: test_systemctl"
  echo "Checking systemctl is running in all network node containers"
  echo "Nodes: " "${nodes[@]}" ", Total:" "${#nodes[@]}"
  echo "---------------------------------------------------------------------------"

  local attempts=0
  local status="${EX_ERR}"
  local MAX_ATTEMPTS=10

  for node in "${nodes[@]}"
  do
    attempts=0
    status="${EX_ERR}"

    # make few attempts to check systemctl status
    while [[ "${attempts}" -lt "${MAX_ATTEMPTS}" && "${status}" -ne "${EX_OK}" ]]; do
      attempts=$((attempts + 1))
      kubectl exec "${node}" -c root-container -- systemctl status --no-pager
      status="${?}"
      echo "Checked systemctl status in ${node} (Attempt #${attempts}/${MAX_ATTEMPTS})... >>>>> status: ${status} <<<<<"
      if [[ "${status}" -ne "${EX_OK}" ]]; then
        echo "Sleeping 5s..."
        sleep 5
      fi
    done

    if [[ "${status}" -ne "${EX_OK}" ]]; then
      echo "Error status: ${status}" && return "${EX_ERR}" # break at first error
    fi
  done

  return "${EX_OK}"
}

@test "Check all network node pods are running" {
    test_node_total
    check_test_status
}

@test "Check systemctl is running in all root containers" {
    test_systemctl
    check_test_status
}
