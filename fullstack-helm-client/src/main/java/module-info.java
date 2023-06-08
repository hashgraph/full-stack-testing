module com.hedera.fullstack.helm.client {
    exports com.hedera.fullstack.helm.client;
    exports com.hedera.fullstack.helm.client.model;
    exports com.hedera.fullstack.helm.client.model.install;
    exports com.hedera.fullstack.helm.client.execution;

    opens com.hedera.fullstack.helm.client.model to
            com.fasterxml.jackson.databind;
    opens com.hedera.fullstack.helm.client.model.install to
            com.fasterxml.jackson.databind;

    requires com.hedera.fullstack.base.api;
    requires com.fasterxml.jackson.databind;
}
