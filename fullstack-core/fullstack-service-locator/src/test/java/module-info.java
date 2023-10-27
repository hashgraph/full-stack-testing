import com.hedera.fullstack.service.locator.test.mock.CtorService;
import com.hedera.fullstack.service.locator.test.mock.MockCtorService;
import com.hedera.fullstack.service.locator.test.mock.MockSingleCtorService;
import org.slf4j.spi.SLF4JServiceProvider;

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
    requires com.jcovalent.junit.logging;
    requires org.assertj.core;
    requires org.junit.jupiter.api;
    requires org.slf4j;

    uses CtorService;
    uses SLF4JServiceProvider;

    provides CtorService with
            MockCtorService,
            MockSingleCtorService;
}
