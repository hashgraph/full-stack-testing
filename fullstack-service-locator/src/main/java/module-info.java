module com.hedera.fullstack.service.locator {
    exports com.hedera.fullstack.service.locator.api;
    exports com.hedera.fullstack.service.locator.spi;

    requires com.hedera.fullstack.base.api;

    uses com.hedera.fullstack.service.locator.spi.ServiceLocationProvider;
}
