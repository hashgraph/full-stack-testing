module com.hedera.fullstack.infrastructure.api {
    requires com.hedera.fullstack.resource.generator.api;
    requires com.hedera.fullstack.helm.client;
    requires io.fabric8.kubernetes.client.api;
    exports com.hedera.fullstack.infrastructure.api.model;
    exports com.hedera.fullstack.infrastructure.api;
}
