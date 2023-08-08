#!/usr/bin/env bash

# setup test constants
readonly EX_OK=0
readonly EX_ERR=1
readonly PASS="PASS"
readonly FAIL="FAIL"

# template variables to be rendered during helm chart deployment
readonly TMPL_TOTAL_NODES="{{ .total_nodes }}"

# Setup test variables
if [[ -z "${TOTAL_NODES}" ]]; then
  TOTAL_NODES="${TMPL_TOTAL_NODES}"
fi

####
# Imports a bash file using the built-in source command.
#
# @param $1 - the bash file to be imported
####
function import {
  if [[ -z "${1}" || ! -f "${1}" ]]; then
    return "${EX_OSFILE}"
  elif [[ -f "${1}" ]]; then
    echo "Import: Dependency Included [ file = '${1}' ]"
    # shellcheck disable=SC1090
    source "${1}"
    return "$?"
  fi
}

function get_pod_list() {
  local pattern=$1
  local resp=$(kubectl get pods -o=jsonpath='{range .items[*]}{.metadata.name}{"\n"}' | grep "${pattern}")
  echo "${resp}"
}

function run_test_cases() {
  local test_cases=("${@}")
  if [ $# -eq 0 ]; then
    test_cases=("${TEST_CASES[@]}")
  fi

  echo "Test cases"
  echo "-------------------------------------------------------------"
  for test_case in "${test_cases[@]}"; do
    echo "- ${test_case}"
  done
  echo ""

  local status="${EX_OK}"
  local test_results=()
  for test_case in "${test_cases[@]}"; do
    "${test_case}"
    local test_status="$?"
    if [[ "${test_status}" = "${EX_OK}" ]]; then
      test_results+=("${test_case}: ${PASS}")
    else
      test_results+=("${test_case}: ${FAIL}")
      status="${EX_ERR}"
    fi
  done

  echo ""
  echo "-------------------------------------------------------------"
  echo "Test results"
  echo "-------------------------------------------------------------"
  for test_result in "${test_results[@]}"; do
    echo "${test_result}"
  done

  return "${status}"
}

# This is to check the bats test execution status
function check_test_status() {
  echo "status = ${status}"
  echo "output = ${output}"
  [[ "${status}" -eq 0 ]]
}
