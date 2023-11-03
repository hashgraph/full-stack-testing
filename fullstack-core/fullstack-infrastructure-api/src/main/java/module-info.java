module com.hedera.fullstack.infrastructure.api {
    requires com.hedera.fullstack.resource.generator.api;
    requires com.hedera.fullstack.model;

    exports com.hedera.fullstack.infrastructure.api.model;
    exports com.hedera.fullstack.infrastructure.api.model.networknode;
    exports com.hedera.fullstack.infrastructure.api.traits;
    exports com.hedera.fullstack.infrastructure.api.model.mirrornode;
    exports com.hedera.fullstack.infrastructure.api.exceptions;
    exports com.hedera.fullstack.infrastructure.api.manager;
    exports com.hedera.fullstack.infrastructure.api.model.networknode.component;
    exports com.hedera.fullstack.infrastructure.api.model.mirrornode.component;
}
