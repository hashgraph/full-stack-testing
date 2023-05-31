module com.hedera.fullstack.helm.client {
    exports com.hedera.fullstack.helm.client;
    exports com.hedera.fullstack.helm.client.model;

    exports com.hedera.fullstack.helm.client.impl to
            com.hedera.fullstack.helm.client.test;
    exports com.hedera.fullstack.helm.client.resource to
            com.hedera.fullstack.helm.client.test;
    exports com.hedera.fullstack.helm.client.proxy.request.authentication to
            com.hedera.fullstack.helm.client.test;

    opens com.hedera.fullstack.helm.client.model to com.fasterxml.jackson.databind;

    requires com.hedera.fullstack.base.api;
    requires com.fasterxml.jackson.databind;
}
