import com.hedera.fullstack.service.locator.test.mock.CtorService;

module com.hedera.fullstack.service.locator.test {
    exports com.hedera.fullstack.service.locator.test.mock;

    opens com.hedera.fullstack.service.locator.test.api to
            org.junit.platform.commons;
    opens com.hedera.fullstack.service.locator.test.mock to
            com.hedera.fullstack.service.locator,
            com.hedera.fullstack.base.api,
            java.base;

    requires com.hedera.fullstack.base.api;
    requires com.hedera.fullstack.service.locator;
    requires org.assertj.core;
    requires org.junit.jupiter.api;

    uses CtorService;

    provides com.hedera.fullstack.service.locator.test.mock.CtorService with
            com.hedera.fullstack.service.locator.test.mock.MockCtorService;
}
