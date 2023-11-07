module com.hedera.fullstack.infrastructure.api {
    requires com.hedera.fullstack.resource.generator.api;
    requires com.hedera.fullstack.configuration.api;

    exports com.hedera.fullstack.infrastructure.api.model;
    exports com.hedera.fullstack.infrastructure.api.traits;
    exports com.hedera.fullstack.infrastructure.api.exceptions;
    exports com.hedera.fullstack.infrastructure.api.manager;
}
