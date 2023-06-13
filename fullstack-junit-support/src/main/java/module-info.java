module com.hedera.fullstack.junit.support {
    exports com.hedera.fullstack.junit.support;
    exports com.hedera.fullstack.junit.support.annotation;
    exports com.hedera.fullstack.junit.support.annotation.node;
    exports com.hedera.fullstack.junit.support.annotation.services;
    exports com.hedera.fullstack.junit.support.annotation.validation;
    exports com.hedera.fullstack.junit.support.extensions to
            org.junit.platform.commons;

    requires transitive org.junit.jupiter.api;
}
