# bats file_tags=deployment-test
setup() {
    source "$(dirname "${BATS_TEST_FILENAME}")/env.sh"
    source "${TESTS_DIR}/load.sh"
}

@test "Check haproxy deployment" {
  log_debug "---------------------------------------------------------------------------"
  log_debug "TEST: Checking if HAProxy is running"
  log_debug "---------------------------------------------------------------------------"

  local resp="$(get_pod_list network-node)"
  local pods=(${resp}) # convert into an array
  log_debug "Network node: ${pods[*]}"

  local test_status="${FAIL}"
  local status_val="${EX_ERR}"
  if [[ "${#pods[@]}" -gt 0 ]]; then
    test_status="${PASS}"
    for pod in "${pods[@]}"; do
      log_debug ""
      local node_name=$(get_pod_label "${pod}" "fullstack.hedera.com/node-name")
      [[ -z "${node_name}" ]] && test_status="${FAIL}" && break

      local is_enabled=$(is_enabled_for_node "${node_name}" ".haproxy.enabled")
      if [ "${is_enabled}" = "TRUE" ]; then
        log_debug "HAProxy is enabled for node '${node_name}'"
        log_debug "Checking HAProxy for network-node '${node_name}'"
        local haproxy_pod=$(get_pod_by_label "app=haproxy-${node_name},fullstack.hedera.com/type=haproxy")
        log_debug "Checking HAProxy pod ${haproxy_pod}"
        is_pod_phrase_running "${haproxy_pod}" || test_status="${FAIL}"
      else
        log_debug "HAProxy is not enabled for node '${node_name}'. Skipping check"
      fi

      [ "${test_status}" = "FAIL" ] && break
    done
  fi

  log_debug ""
  log_debug "[${test_status}] HAProxy Check"
  log_debug ""

  # assert success
  [ "${test_status}" = "${PASS}" ]
}

@test "Check envoy proxy deployment" {
  log_debug "---------------------------------------------------------------------------"
  log_debug "TEST: Checking if Envoy Proxy is running"
  log_debug "---------------------------------------------------------------------------"

  local resp="$(get_pod_list network-node)"
  local pods=(${resp}) # convert into an array
  log_debug "Network node: ${pods[*]}"

  local test_status="${FAIL}"
  local status_val="${EX_ERR}"
  if [[ "${#pods[@]}" -gt 0 ]]; then
    test_status="${PASS}"
    for pod in "${pods[@]}"; do
      log_debug ""
      local node_name=$(get_pod_label "${pod}" "fullstack.hedera.com/node-name")
      [[ -z "${node_name}" ]] && test_status="${FAIL}" && break

      local is_enabled=$(is_enabled_for_node "${node_name}" ".envoyProxy.enabled")
      if [ "${is_enabled}" = "TRUE" ]; then
        log_debug "EnvoyProxy is enabled for node '${node_name}'"
        log_debug "Checking Envoy proxy for network-node '${node_name}'"
        local envoy_proxy_pod=$(get_pod_by_label "app=envoy-proxy-${node_name},fullstack.hedera.com/type=envoy-proxy")

        log_debug "Checking Envoy Proxy pod ${envoy_proxy_pod}"
        is_pod_ready "${envoy_proxy_pod}" || test_status="${FAIL}"
      else
        log_debug "EnvoyProxy is not enabled for node '${node_name}'. Skipping check"
      fi

      [ "${test_status}" = "FAIL" ] && break
    done
  fi

  log_debug ""
  log_debug "[${test_status}] Envoy Proxy Check"
  log_debug ""

  # assert success
  [ "${test_status}" = "${PASS}" ]
}
