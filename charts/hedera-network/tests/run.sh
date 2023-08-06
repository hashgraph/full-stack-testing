#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly SCRIPT_DIR

# shellcheck source=./helper.sh
source "${SCRIPT_DIR}/helper.sh"

function run_tests() {
  local test_node_total_status
  local test_systemctl_status

  test_node_total
  local status="$?"
  [ "${status}" = "${EX_OK}" ] && test_node_total_status="PASS" || test_node_total_status="FAIL"

  test_systemctl
  local status="$?"
  [ "${status}" = "${EX_OK}" ] && test_systemctl_status="PASS" || test_systemctl_status="FAIL"

  echo "-------------------------------------------------------------"
  echo "Test results"
  echo "-------------------------------------------------------------"
  echo "test_node_total: ${test_node_total_status}"
  echo "test_systemctl: ${test_systemctl_status}"

  [ "${test_node_total_status}" = "PASS" ] && \
  [ "${test_systemctl_status}" = "PASS" ] || return "${EX_ERR}"

  return "${EX_OK}"
}

echo "Test scripts: "
echo "=========================="
ls -la "${SCRIPT_DIR}"/

run_tests

