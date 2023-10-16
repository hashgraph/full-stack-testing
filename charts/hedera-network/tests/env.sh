#!/usr/bin/env bash
# This file initializes the core mandatory env variables
# Every script must load (source) this in the beginning
# Warning: avoid making these variables readonly since it can be sourced multiple times

CUR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

# load .env file if it exists in order to load variables with custom values
ENV_FILE="${CUR_DIR}/.env"
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck source=./../temp/.env
  source "${ENV_FILE}"
  set +a
fi

# set global env variables if not set
BATS_HOME="${BATS_HOME:-${CUR_DIR}/../../../dev/bats}"
TESTS_DIR="${TESTS_DIR:-${CUR_DIR}}"

TOTAL_NODES="${TOTAL_NODES:-3}"
USER="${USER:-changeme}"
NAMESPACE="${NAMESPACE:-fst-${USER}}"
RELEASE_NAME="${RELEASE_NAME:-fst}"
LOG_DIR="${LOG_DIR:-${CUR_DIR}/logs}"
LOG_FILE="${LOG_FILE:-helm-test.log}"
OUTPUT_LOG="${OUTPUT_LOG:-false}"
[ ! -d "${LOG_DIR}" ] && mkdir "${LOG_DIR}"

echo "--------------------------Env Setup: fullstack-testing Helm Test------------------------------------------------"
echo "NAMESPACE: ${NAMESPACE}"
echo "RELEASE_NAME: ${RELEASE_NAME}"
echo "ENV_FILE: ${ENV_FILE}"
echo "BATS_HOME: ${BATS_HOME}"
echo "TESTS_DIR: ${TESTS_DIR}"
echo "LOG: ${LOG_DIR}/${LOG_FILE}"
echo "OUTPUT_LOG: ${OUTPUT_LOG}"
echo "-----------------------------------------------------------------------------------------------------"
echo ""
