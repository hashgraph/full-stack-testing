module com.hedera.fullstack.servicelocator.api.test {
    opens com.hedera.fullstack.servicelocator.api.test to
            org.junit.platform.commons;
    opens com.hedera.fullstack.servicelocator.api.test.mock to
            com.hedera.fullstack.servicelocator.api,
            com.hedera.fullstack.base.api;

    requires com.hedera.fullstack.base.api;
    requires com.hedera.fullstack.servicelocator.api;
    requires org.assertj.core;
    requires org.junit.jupiter.api;
}
