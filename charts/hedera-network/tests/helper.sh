#!/bin/bash

readonly EX_OK=0
readonly EX_ERR=1

readonly TOTAL_NODES="{{ .total_nodes }}"

function get_pod_list() {
  local pattern=$1
  local resp=$(kubectl get pods -o=jsonpath='{range .items[*]}{.metadata.name}{"\n"}' | grep "${pattern}")
  echo "${resp}"
}

function test_node_total() {
  # set test expectations

  echo "-------------------------------------------------------------"
  echo "Checking total number of network node containers"
  echo "-------------------------------------------------------------"
  kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l fullstack.hedera.com/type=network-node --timeout=300s || return "${EX_ERR}"

  local resp="$(get_pod_list network-node)"
  local nodes=(${resp}) # convert into an array
  echo "Nodes: " "${nodes[@]}"
  local node_total=${#nodes[@]}

  echo "Total network node: ${node_total} (expected - ${TOTAL_NODES})"
  echo ""

  # assert true
  if [[ "${node_total}" -ne "${TOTAL_NODES}" ]]; then
    return "${EX_ERR}"
  fi

  return "${EX_OK}"
}

function test_systemctl() {
  local resp="$(get_pod_list network-node)"
  local nodes=(${resp}) # convert into an array

  echo "-------------------------------------------------------------"
  echo "Checking systemctl is running in all network node containers"
  echo "Nodes: " "${nodes[@]}" ", Total:" "${#nodes[@]}"
  echo "-------------------------------------------------------------"

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
      echo "Checked systemctl status in ${node} (Attempt #${attempts})... >>>>> status: ${status} <<<<<"
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