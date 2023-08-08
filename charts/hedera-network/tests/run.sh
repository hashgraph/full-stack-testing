#!/usr/bin/env bash
BATS_HOME="${BATS_HOME:-../../../dev/bats}"
TESTS_DIR="${TESTS_DIR:-.}"

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
#"${BATS_HOME}/bats-core/bin/bats" --no-tempdir-cleanup .
