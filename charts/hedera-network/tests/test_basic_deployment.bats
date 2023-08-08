# bats file_tags=deployment-test
setup() {
    source "$(dirname "${BATS_TEST_FILENAME}")/env.sh"
    source "${TESTS_DIR}/load.sh"
}

@test "Check all network node pods are running" {
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

  local test_status="${FAIL}"
  if [[ "${node_total}" -eq "${TOTAL_NODES}" ]]; then
    test_status="${PASS}"
  fi

  echo ""
  echo "[${test_status}] Total network node: ${node_total}; expected: ${TOTAL_NODES}"
  echo ""

  # assert success
  [[ "${node_total}" -eq "${TOTAL_NODES}" ]]
}

@test "Check systemctl is running in all root containers" {
  local resp="$(get_pod_list network-node)"
  local nodes=(${resp}) # convert into an array

  echo "---------------------------------------------------------------------------"
  echo "Test case: test_systemctl"
  echo "Checking systemctl is running in all network node containers"
  echo "Nodes: " "${nodes[@]}" ", Total:" "${#nodes[@]}"
  echo "---------------------------------------------------------------------------"

  local attempts=0
  local systemctl_status="${FAIL}"
  local MAX_ATTEMPTS=10

  for node in "${nodes[@]}"
  do
    attempts=0
    systemctl_status="${EX_ERR}"

    # make few attempts to check systemctl status
    while [[ "${attempts}" -lt "${MAX_ATTEMPTS}" && "${systemctl_status}" -ne "${EX_OK}" ]]; do
      attempts=$((attempts + 1))
      kubectl exec "${node}" -c root-container -- systemctl status --no-pager
      systemctl_status="${?}"
      echo "Checked systemctl status in ${node} (Attempt #${attempts}/${MAX_ATTEMPTS})... >>>>> status: ${systemctl_status} <<<<<"
      if [[ "${systemctl_status}" -ne "${EX_OK}" ]]; then
        echo "Sleeping 5s..."
        sleep 5
      fi
    done

    if [[ "${systemctl_status}" -ne "${EX_OK}" ]]; then
      break # break at first node error
    fi
  done

  # assert success
  [[ "${systemctl_status}" -eq "${EX_OK}" ]]
}
