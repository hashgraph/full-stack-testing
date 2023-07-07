module com.hedera.fullstack.base.api {
    requires com.jcovalent.junit.logging;
    requires org.slf4j;

    exports com.hedera.fullstack.base.api.functional;
    exports com.hedera.fullstack.base.api.io;
    exports com.hedera.fullstack.base.api.os;
    exports com.hedera.fullstack.base.api.resource;
    exports com.hedera.fullstack.base.api.util;
    exports com.hedera.fullstack.base.api.version;
}
