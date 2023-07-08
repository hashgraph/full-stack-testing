#!/bin/bash

EX_OK=0
EX_ERR=1

function get_pod_list() {
  local pattern=$1
  local resp=$(kubectl get pods -o=jsonpath='{range .items[*]}{.metadata.name}{"\n"}' | grep "${pattern}")
  echo "${resp}"
}

function test_node_total() {
  # set test expectations
  local expected_node_total=3

  echo "-------------------------------------------------------------"
  echo "Checking total number of network node containers"
  echo "-------------------------------------------------------------"

  local resp="$(get_pod_list network-node)"
  local nodes=(${resp}) # convert into an array
  echo "Nodes: " "${nodes[@]}"
  local node_total=${#nodes[@]}

  echo "Total network node: ${node_total} (expected: ${expected_node_total})"
  echo ""

  # assert equal
  [ "${node_total}" = "${expected_node_total}" ] || return "${EX_ERR}"
  return "${EX_OK}"
}

function test_systemctl() {
  # test that systemctl status is ready in node containers
  local systemctl_all_nodes="${EX_ERR}" # by default set to error status

  echo "-------------------------------------------------------------"
  echo "Checking systemctl is running in all network node containers"
  echo "-------------------------------------------------------------"

  local resp="$(get_pod_list network-node)"
  local nodes=(${resp}) # convert into an array
  echo "Nodes: " "${nodes[@]}"
  for node in "${nodes[@]}"
  do
    local cmd="kubectl exec ${node} -c root-container -- systemctl status --no-pager"

    kubectl exec "${node}" -c root-container -- systemctl status --no-pager
    local status="$?"

    echo "'${cmd}' => ${status} (expected: 0)"

    if [ "${status}" != "${EX_OK}" ]; then
      systemctl_all_nodes="${EX_ERR}"
      break # break at first error
    fi

    systemctl_all_nodes="${EX_OK}"
  done

  # assert 0
  [ "${systemctl_all_nodes}" = "${EX_OK}" ] || return "${EX_ERR}"

  return "${EX_OK}"
}

function run_tests() {
  local test_node_total_status
  local test_systemctl_status

  test_node_total
  local status="$?"
  [ "${status}" = "${EX_OK}" ] && test_node_total_status="PASS" || test_node_total_status="FAIL"

  test_systemctl
  local status="$?"
  [ "${status}" = "${EX_OK}" ] && test_systemctl_status="PASS" || test_systemctl_status="FAIL"

  echo ""
  echo "Test results"
  echo "-------------------------------------------------------------"
  echo "test_node_total: ${test_node_total_status}"
  echo "test_systemctl: ${test_systemctl_status}"

  [ "${test_node_total_status}" = "PASS" ] && \
  [ "${test_systemctl_status}" = "PASS" ] || return "${EX_ERR}"

  return "${EX_OK}"
}

run_tests

