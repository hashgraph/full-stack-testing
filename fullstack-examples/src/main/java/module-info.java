module com.hedera.fullstack.examples {
    exports com.hedera.fullstack.examples.monitors;
    exports com.hedera.fullstack.examples.readiness;
    exports com.hedera.fullstack.examples.validators;

    requires com.hedera.fullstack.readiness.api;
    requires com.hedera.fullstack.monitoring.api;
    requires com.hedera.fullstack.test.toolkit;
    requires com.hedera.fullstack.validator.api;
}
