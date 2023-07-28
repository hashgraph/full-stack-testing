module com.hedera.fullstack.service.locator.java.sls {
    exports com.hedera.fullstack.service.locator.java.sls;

    requires transitive com.hedera.fullstack.service.locator;

    provides com.hedera.fullstack.service.locator.spi.ServiceLocationProvider with
            com.hedera.fullstack.service.locator.java.sls.JavaServiceLoaderProvider;
}
