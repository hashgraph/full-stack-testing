#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

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
"${BATS_HOME}/bats-core/bin/bats" "${TESTS_DIR}"

# uncomment in order to inspect tmpdir
#"${BATS_HOME}/bats-core/bin/bats" --no-tempdir-cleanup .
