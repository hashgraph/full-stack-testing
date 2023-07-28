module com.hedera.fullstack.service.locator.java.sls.test {
    opens com.hedera.fullstack.service.locator.java.sls.test to
            org.junit.platform.commons;

    requires com.hedera.fullstack.service.locator.java.sls;
    requires com.hedera.fullstack.service.locator.test.fixtures;
    requires org.assertj.core;
    requires org.junit.jupiter.api;

    uses com.hedera.fullstack.service.locator.test.fixtures.mock.CtorService;
}
