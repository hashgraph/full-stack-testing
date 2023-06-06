module com.hedera.fullstack.base.api.test {
    opens com.hedera.fullstack.base.api.test.util to
            org.junit.platform.commons;

    requires org.junit.jupiter.api;
    requires com.hedera.fullstack.base.api;
}
