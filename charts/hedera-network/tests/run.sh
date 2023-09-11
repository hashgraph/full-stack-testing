#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
source "$(dirname "${BASH_SOURCE[0]}")/logging.sh"

clear_log

echo ""
echo "BATS directory: $BATS_HOME"
echo "============================================================="
ls -la "${BATS_HOME}"

echo ""
echo "Tests directory: $TESTS_DIR"
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

# uncomment in order to inspect tmpdir
#"${BATS_HOME}/bats-core/bin/bats" --no-tempdir-cleanup .

if [[ "${OUTPUT_LOG}" = "true" ]]; then
  cat_log
fi

exit "${bats_exec_status}"