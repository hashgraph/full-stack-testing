module com.hedera.fullstack.infrastructure.api {
    requires com.hedera.fullstack.resource.generator.api;
    requires com.hedera.fullstack.model;

    exports com.hedera.fullstack.infrastructure.api;
    exports com.hedera.fullstack.infrastructure.api.model;
    exports com.hedera.fullstack.infrastructure.api.model.networknode;
    exports com.hedera.fullstack.infrastructure.api.model.traits;
    exports com.hedera.fullstack.infrastructure.api.model.mirrornode;
}
