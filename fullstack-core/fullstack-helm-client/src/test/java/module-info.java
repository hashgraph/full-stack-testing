module com.hedera.fullstack.helm.client.test {
    opens com.hedera.fullstack.helm.client.test to
            org.junit.platform.commons;
    opens com.hedera.fullstack.helm.client.test.execution to
            org.junit.platform.commons;
    opens com.hedera.fullstack.helm.client.test.model to
            org.junit.platform.commons;
    opens com.hedera.fullstack.helm.client.test.model.chart to
            org.junit.platform.commons;
    opens com.hedera.fullstack.helm.client.test.proxy.request.chart to
            org.junit.platform.commons;
    opens com.hedera.fullstack.helm.client.test.software to
            org.junit.platform.commons;

    requires com.fasterxml.jackson.databind;
    requires com.hedera.fullstack.base.api;
    requires com.hedera.fullstack.helm.client;
    requires com.jcovalent.junit.logging;
    requires jdk.attach;
    requires org.assertj.core;
    requires org.junit.jupiter.api;
    requires org.junit.jupiter.params;
    requires org.mockito.junit.jupiter;
    requires org.mockito;
    requires org.slf4j;
}
