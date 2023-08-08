#!/usr/bin/env bash

# setup constants
readonly EX_OK=0
readonly EX_ERR=1
readonly PASS="PASS"
readonly FAIL="FAIL"

# load .env file if it exists in order to load variables with custom values
if [[ -f "${ENV_FILE}" ]]; then
  export $(cat "${ENV_FILE}" | xargs)
fi

# template variables rendered during helm chart deployment
readonly TMPL_TOTAL_NODES="{{ .total_nodes }}"

# Setup variables
if [[ -z "${TOTAL_NODES}" ]]; then
  TOTAL_NODES="${TMPL_TOTAL_NODES}"
fi

