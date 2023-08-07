#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly SCRIPT_DIR

source "${SCRIPT_DIR}/include.sh"

run_test_cases test_node_total test_systemctl
