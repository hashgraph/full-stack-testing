#!/bin/bash

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
