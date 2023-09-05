#!/usr/bin/env bash

readonly LOG_DIR="logs"
readonly LOG_FILE="test.log"

function clear_log() {
  if [[ -f "logs/${LOG_FILE}" ]]; then
    rm -f "logs/${LOG_FILE}"
  fi
}

function log() {
  local level=$1
  local msg=$2
  local file=$3
  local dt=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  echo "${dt} | ${level} | ${msg}" >> "logs/${3}"
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
