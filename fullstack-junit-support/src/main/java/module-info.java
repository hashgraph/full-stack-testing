module com.hedera.fullstack.junit.support {
    // Global Exports
    exports com.hedera.fullstack.junit.support.annotation.application;
    exports com.hedera.fullstack.junit.support.annotation.core;
    exports com.hedera.fullstack.junit.support.annotation.flow;
    exports com.hedera.fullstack.junit.support.annotation.resource;
    exports com.hedera.fullstack.junit.support.annotation.services;
    exports com.hedera.fullstack.junit.support.annotation.validation;
    exports com.hedera.fullstack.junit.support.events.application;

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
