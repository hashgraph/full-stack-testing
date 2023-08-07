#!/bin/bash
# This is test runner used by helm test container to run tests without any other dependencies such as BATS framework.
# Usage: ./scripts/run.sh <test_case-1>...<test_case-N>
# e.g. ./scripts/run.sh test_node_total OR ./scripts/run.sh (runs all tests as specified in TEST_CASES variable below)

# setup some global variables
if [[ -z "${SCRIPT_DIR}" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
fi

source "${SCRIPT_DIR}/include.sh"

# list of all test cases supported by default
readonly TEST_CASES=(\
  test_node_total \
  test_systemctl \
  )

function run() {
  local test_cases


  echo "Test scripts directory: "
  echo "=========================="
  ls -la "${SCRIPT_DIR}"/
  echo ""

  run_test_cases "$@"
}

run "$@"


