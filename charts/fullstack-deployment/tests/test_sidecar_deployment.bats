# bats file_tags=deployment-test
setup() {
    source "$(dirname "${BATS_TEST_FILENAME}")/env.sh"
    source "${TESTS_DIR}/load.sh"
}

function run_default_sidecar_check() {
  local sidecar_name=$1
  local enable_config_path=$2

  log_debug "---------------------------------------------------------------------------"
  log_debug "TEST: Checking if ${sidecar_name} is running"
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
      log_debug "Checking pod ${pod} for sidecar ${sidecar_name}"

      local should_enable=$(get_config_val_upper "${enable_config_path}")
      log_debug "${sidecar_name} is enabled in pod ${pod}: ${should_enable}"

      local sidecar_exists=$(has_sidecar "${pod}" "${sidecar_name}" )
      log_debug "${sidecar_name} exists in pod ${pod}: ${sidecar_exists} "

      if [ "${should_enable}" = "TRUE" ] && [ "${sidecar_exists}" = "TRUE" ]; then
        is_sidecar_ready "${pod}" "${sidecar_name}" || test_status="${FAIL}"
      elif [[ "${should_enable}" != "${sidecar_exists}" ]]; then
        test_status="${FAIL}"
      fi

      [ "${test_status}" = "FAIL" ] && break
    done
  fi

  log_debug ""
  log_debug "[${test_status}] ${sidecar_name} sidecar is running in all network-node pods in namespace ${NAMESPACE}"
  log_debug ""

  # assert success
  [ "${test_status}" = "${PASS}" ]
}

@test "Check record-stream-uploader sidecar" {
  local sidecar_name="record-stream-uploader"
  local enable_config_path=".defaults.sidecars.recordStreamUploader.enabled"

  run_default_sidecar_check "${sidecar_name}" "${enable_config_path}"
}

@test "Check record-stream-sidecar-uploader sidecar" {
  local sidecar_name="record-stream-sidecar-uploader"
  local enable_config_path=".defaults.sidecars.recordStreamSidecarUploader.enabled"

  run_default_sidecar_check "${sidecar_name}" "${enable_config_path}"
}

@test "Check event-stream-uploader sidecar" {
  local sidecar_name="event-stream-uploader"
  local enable_config_path=".defaults.sidecars.eventStreamUploader.enabled"

  run_default_sidecar_check "${sidecar_name}" "${enable_config_path}"
}

@test "Check account-balance-uploader sidecar" {
  local sidecar_name="account-balance-uploader"
  local enable_config_path=".defaults.sidecars.accountBalanceUploader.enabled"

  run_default_sidecar_check "${sidecar_name}" "${enable_config_path}"
}

@test "Check backup-uploader sidecar" {
  local sidecar_name="backup-uploader"
  local enable_config_path=".defaults.sidecars.backupUploader.enabled"

  run_default_sidecar_check "${sidecar_name}" "${enable_config_path}"
}

@test "Check otel-collector sidecar" {
  local sidecar_name="otel-collector"
  local enable_config_path=".defaults.sidecars.otelCollector.enabled"

  run_default_sidecar_check "${sidecar_name}" "${enable_config_path}"
}
