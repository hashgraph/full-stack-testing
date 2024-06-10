#!/usr/bin/env bash
CUR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
source "${CUR_DIR}/env.sh"
source "${CUR_DIR}/logging.sh"

clear_log

echo "Cluster Resources"
echo "NAMESPACE: ${NAMESPACE}"
echo "============================================================="
echo "------------------------------------------- Namespaces ----------------------------------------------------------"
kubectl get ns
kubectl config get-contexts
echo "------------------------------------------- GatewayClass ---------------------------------------------------------"
kubectl get GatewayClass
echo "------------------------------------------- ClusterRole ----------------------------------------------------------"
kubectl get ClusterRole
echo "------------------------------------------- Pods -----------------------------------------------------------------"
kubectl get pods
echo "------------------------------------------- Services -------------------------------------------------------------"
kubectl get svc
echo "------------------------------------------------------------------------------------------------------------------"

echo ""
echo "File list in 'BATS_HOME': $BATS_HOME"
echo "============================================================="
ls -la "${BATS_HOME}"

echo ""
echo "File list in 'TEST_DIR': $TESTS_DIR"
echo "============================================================="
ls -la "${TESTS_DIR}"

echo ""
echo "Running BATS: '${BATS_HOME}/bats-core/bin/bats ${TESTS_DIR}'"
echo "============================================================="
readonly test_file=$1

if [[ -z "${test_file}" ]]; then
  "${BATS_HOME}/bats-core/bin/bats" "${TESTS_DIR}"
else
  "${BATS_HOME}/bats-core/bin/bats" "${TESTS_DIR}/${test_file}"
fi

readonly bats_exec_status=$?

# print test status in the log file
log_debug "Exit code: ${bats_exec_status}"
if [[ $bats_exec_status -eq 0 ]];then
  log_debug "Test status: PASS"
else
  log_debug "Test status: FAIL"
fi

# uncomment in order to inspect tmpdir
#"${BATS_HOME}/bats-core/bin/bats" --no-tempdir-cleanup .

if [[ "${OUTPUT_LOG}" = "true" ]]; then
  cat_log
fi

exit "${bats_exec_status}"
