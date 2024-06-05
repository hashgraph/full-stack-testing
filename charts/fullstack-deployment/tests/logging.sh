#!/usr/bin/env bash

function clear_log() {
  if [[ -f "${LOG_DIR}/${LOG_FILE}" ]]; then
    rm -f "${LOG_DIR}/${LOG_FILE}"
  fi
}

function cat_log() {
  if [[ -f "${LOG_DIR}/${LOG_FILE}" ]]; then
    echo "****** TEST LOG: ${LOG_DIR}/${LOG_FILE} *****"
    cat "${LOG_DIR}/${LOG_FILE}"
  else
    log_debug "ERROR: log file '${LOG_DIR}/${LOG_FILE}' does not exist"
  fi
}


function log() {
  local level=$1
  local msg=$2
  local file=$3
  local dt=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  echo "${dt} | ${level} | ${msg}" >> "${LOG_DIR}/${3}"
}

function log_debug() {
  local msg=$1
  log "DEBUG" "${msg}" "${LOG_FILE}"
}

function log_error() {
  local msg=$1
  log "ERROR" "${msg}" "${LOG_FILE}"
}

function log_info() {
  local msg=$1
  log "INFO " "${msg}" "${LOG_FILE}"
}

function log_pass() {
  local msg=$1
  log "INFO " "(${PASS}) ${msg}" "${LOG_FILE}"
}

function log_fail() {
  local msg=$1
  log "INFO " "(${FAIL}) ${msg}" "${LOG_FILE}"
}

function log_line_sep() {
  log_debug "---"
}
