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

    requires com.hedera.fullstack.base.api;
    requires org.assertj.core;
    requires org.junit.jupiter.api;
    requires com.hedera.fullstack.helm.client;
    requires com.jcovalent.junit.logging;
    requires org.junit.jupiter.params;
    requires org.slf4j;
    requires org.mockito;
    requires org.mockito.junit.jupiter;
    requires com.fasterxml.jackson.databind;
    requires jdk.attach;
}
