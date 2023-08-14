module com.hedera.fullstack.junit.support {
    // Global Exports
    exports com.hedera.fullstack.junit.support.annotations.application;
    exports com.hedera.fullstack.junit.support.annotations.core;
    exports com.hedera.fullstack.junit.support.annotations.flow;
    exports com.hedera.fullstack.junit.support.annotations.resource;
    exports com.hedera.fullstack.junit.support.annotations.services;
    exports com.hedera.fullstack.junit.support.annotations.validation;
    exports com.hedera.fullstack.junit.support.events.application;
    exports com.hedera.fullstack.junit.support.inject.core;

    // Targeted Exports
    exports com.hedera.fullstack.junit.support.extensions to
            org.junit.platform.commons;

    // Transitive Requirements
    requires transitive com.hedera.fullstack.base.api;
    requires transitive com.hedera.fullstack.validator.api;
    requires transitive com.hedera.fullstack.monitoring.api;
    requires transitive com.hedera.fullstack.readiness.api;
    requires transitive org.junit.jupiter.api;
    requires transitive org.junit.jupiter.params;

// Direct Requirements
}
