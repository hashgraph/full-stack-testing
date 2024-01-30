# bats file_tags=deployment-test
setup() {
    source "$(dirname "${BATS_TEST_FILENAME}")/env.sh"
    source "${TESTS_DIR}/load.sh"
}

@test "Check Network Node GRPC routes" {
  log_debug "----------------------------------------------------------------------------"
  log_debug "TEST: Checking Network Node GRPC Route"
  log_debug "----------------------------------------------------------------------------"

  local resp="$(get_pod_list network-node)"
  local pods=(${resp}) # convert into an array
  log_debug "Network nodes: ${pods[*]}"

  local test_status="${FAIL}"
  local status_val="${EX_ERR}"
  if [[ "${#pods[@]}" -gt 0 ]]; then
    test_status="${PASS}"
    for pod in "${pods[@]}"; do
      log_debug ""
      local node_name=$(get_pod_label "${pod}" "fullstack.hedera.com/node-name")
      [[ -z "${node_name}" ]] && test_status="${FAIL}" && break

      local route_name="node-grpc-route-${node_name}"
      local is_enabled=$(is_enabled_for_node "${node_name}" ".haproxy.enabled")
      if [ "${is_enabled}" = "FALSE" ]; then
        log_debug "Checking Node GRPC route '${route_name}'"
        is_route_accepted "tcproute" "${route_name}" || test_status="${FAIL}"
        [ "${test_status}" = "FAIL" ] && break
      else
        log_debug "HAProxy enabled for node '${node_name}'. Skipped route check for '${route_name}'."
      fi
    done
  fi

  log_debug ""
  log_debug "[${test_status}] Node GRPC Route Check"
  log_debug ""

  # assert success
  [[ "${test_status}" = "${PASS}" ]]
}
