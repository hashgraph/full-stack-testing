#!/usr/bin/env bash
# This file initializes the core mandatory env variables
# Every script must load (source) this in the beginning
# Warning: avoid making these variables readonly since it can be sourced multiple times

# load .env file if it exists in order to load variables with custom values
ENV_FILE="$(dirname "${BASH_SOURCE[0]}")/.env"
if [[ -f "${ENV_FILE}" ]]; then
  export $(cat "${ENV_FILE}" | xargs)
fi


# set global env variables if not set
BATS_HOME="${BATS_HOME:-../../../dev/bats}"
TESTS_DIR="${TESTS_DIR:-.}"

echo ""
echo "Mandatory variables"
echo "=============================================="
echo "ENV_FILE: ${ENV_FILE}"
echo "BATS_HOME: ${BATS_HOME}"
echo "TESTS_DIR: ${TESTS_DIR}"

