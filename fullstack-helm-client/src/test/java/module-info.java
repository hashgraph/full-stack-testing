module com.hedera.fullstack.helm.client.test {
    opens com.hedera.fullstack.helm.client.test to
            org.junit.platform.commons;
    opens com.hedera.fullstack.helm.client.test.software to
            org.junit.platform.commons;

    requires com.hedera.fullstack.base.api;
    requires com.hedera.fullstack.helm.client;
    requires org.assertj.core;
    requires org.junit.jupiter.api;
}
