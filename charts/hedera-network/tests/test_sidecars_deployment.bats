# bats file_tags=deployment-test
setup() {
    source "$(dirname "${BATS_TEST_FILENAME}")/env.sh"
    source "${TESTS_DIR}/load.sh"
}

@test "Check all sidecars are running" {
  local resp="$(get_pod_list network-node)"
  local nodes=(${resp}) # convert into an array

  log_debug "---------------------------------------------------------------------------"
  log_debug "TEST: Checking all sidecars are running" 2>&1
  log_debug "---------------------------------------------------------------------------"

  local sidecars=$(kubectl get pods network-node0-0 -o jsonpath='{.spec.containers[*].name}')
  log_debug "Sidecar list: ${sidecars[*]}"

  local test_status="${PASS}"
  local status_val="${EX_ERR}"
  for i in "defaults.sidecars.recordStreamUploader.enable":"record-stream-uploader" \
           "defaults.sidecars.eventStreamUploader.enable":"event-stream-uploader" \
           "defaults.sidecars.accountBalanceUploader.enable":"account-balance-uploader" \
           "defaults.sidecars.backupUploader.enable":"backup-uploader"; \
  do
    KEY=${i%:*};
    VAL=${i#*:};

    log_line_sep
    has_sidecar "${KEY}" "${VAL}" "${sidecars}"
    status_val="${?}"
    if [[ "${status_val}" -ne "${EX_OK}" ]]; then
      test_status="${FAIL}"
      break # break at first node error
    fi
    log_debug "(${test_status}) ${VAL} is running"
  done

  log_debug ""
  log_debug "[${test_status}] all sidecars are running"
  log_debug ""

  # assert success
  [[ "${test_status}" = "${PASS}" ]]
}
