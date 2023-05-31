module com.hedera.fullstack.helm.client {
    exports com.hedera.fullstack.helm.client;
    exports com.hedera.fullstack.helm.client.impl to
            com.hedera.fullstack.helm.client.test;
    exports com.hedera.fullstack.helm.client.resource to
            com.hedera.fullstack.helm.client.test;

    requires com.hedera.fullstack.base.api;
}
