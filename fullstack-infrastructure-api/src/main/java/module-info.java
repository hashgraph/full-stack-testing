module com.hedera.fullstack.infrastructure.api {
    requires com.hedera.fullstack.resource.generator.api;
    requires com.hedera.fullstack.helm.client;
    exports com.hedera.fullstack.infrastructure.api.model;
    exports com.hedera.fullstack.infrastructure.api;
}
