#!/usr/bin/env bash

function _common_setup() {
    echo ""
    echo "Mandatory variables"
    echo "=============================================="
    echo "BATS_HOME: ${BATS_HOME}"
    echo "TESTS_DIR: ${TESTS_DIR}"

    if [[ -z "${BATS_HOME}" ]]; then
      echo "ERROR: BATS_HOME is not defined"
      exit 1
    fi

    if [[ -z "${TESTS_DIR}" ]]; then
      echo "ERROR: TESTS_DIR is not defined"
      exit 1
    fi

    echo "Loading bats helper..."
    load "${BATS_HOME}/test_helper/bats-support/load"
    load "${BATS_HOME}/test_helper/bats-assert/load"

    # get the containing directory of this file
    # use $BATS_TEST_FILENAME instead of ${BASH_SOURCE[0]} or $0,
    # as those will point to the bats executable's location or the preprocessed file respectively
    readonly PROJECT_ROOT="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"

    # set PROJECT_ROOT dependent variables
    readonly ENV_FILE="${PROJECT_ROOT}/.env"
}

# invoke common setup
_common_setup

# load helper scripts
echo "Loading test helper scripts..."
load "${TESTS_DIR}/const.sh"
load "${TESTS_DIR}/helper.sh"
