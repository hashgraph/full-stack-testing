#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

function load_bats_helpers() {
  if [[ -z "${BATS_HOME}" ]]; then
    echo "ERROR: BATS_HOME is not defined"
    exit 1
  fi

  echo "Loading bats helper..."
  load "${BATS_HOME}/test_helper/bats-support/load"
  load "${BATS_HOME}/test_helper/bats-assert/load"
}

function load_test_helpers() {
  # load test helper scripts
  echo "Loading test helper scripts..."
  load "${TESTS_DIR}/helper.sh"
  load "${TESTS_DIR}/logging.sh"
}

function _common_setup() {
  load_bats_helpers
  load_test_helpers

}

_common_setup
