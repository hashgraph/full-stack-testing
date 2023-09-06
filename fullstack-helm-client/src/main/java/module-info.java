module com.hedera.fullstack.helm.client {
    exports com.hedera.fullstack.helm.client;
    exports com.hedera.fullstack.helm.client.model;
    exports com.hedera.fullstack.helm.client.model.chart;
    exports com.hedera.fullstack.helm.client.model.install;
    exports com.hedera.fullstack.helm.client.execution;
    exports com.hedera.fullstack.helm.client.proxy.request.chart to
            com.hedera.fullstack.helm.client.test;
    exports com.hedera.fullstack.helm.client.resource to
            com.hedera.fullstack.helm.client.test;

    opens com.hedera.fullstack.helm.client.model to
            com.fasterxml.jackson.databind;
    opens com.hedera.fullstack.helm.client.model.chart to
            com.fasterxml.jackson.databind;
    opens com.hedera.fullstack.helm.client.model.install to
            com.fasterxml.jackson.databind;

    requires com.fasterxml.jackson.databind;
    requires org.slf4j;
    requires transitive com.hedera.fullstack.base.api;
    requires transitive com.fasterxml.jackson.annotation;
}
