#!/bin/bash
# This file initializes global constants

# setup constants
readonly EX_OK=0
readonly EX_ERR=1
readonly PASS="PASS"
readonly FAIL="FAIL"

# template variables rendered during helm chart deployment
readonly TMPL_TOTAL_NODES="{{ .total_nodes }}"

# load .env file if it exists in order to load variables with custom values
if [[ -f "${ENV_FILE}" ]]; then
  export $(cat "${ENV_FILE}" | xargs)
fi


# Initialize required variables using TMPL_* variables if not initialized yet
if [[ -z "${TOTAL_NODES}" ]]; then
  TOTAL_NODES="${TMPL_TOTAL_NODES}"
fi

echo "Constants and Settings:"
echo "======================================"
echo "SCRIPT_DIR: ${SCRIPT_DIR}"
echo "ENV_FILE: ${ENV_FILE}"
echo "TOTAL_NODES: $TOTAL_NODES"
echo "======================================"

