module com.hedera.fullstack.examples.fullstacktest {
    exports com.hedera.fullstack.examples.signing to
            org.junit.platform.commons;

    opens com.hedera.fullstack.examples.signing to
            org.junit.platform.commons;

    requires com.hedera.fullstack.examples;
    requires com.hedera.fullstack.junit.support;
    requires org.junit.jupiter.api;
}
