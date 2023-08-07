setup() {
    load 'test_helper/common-setup'
    _common_setup

    echo "Running tests..."
}

teardown() {
  # TODO tear down
  echo "Finished running tests"
}

@test "Check all network node pods are running" {
    test_node_total
    check_test_status
}

@test "Check systemctl is running in all root containers" {
    test_systemctl
    check_test_status
}
