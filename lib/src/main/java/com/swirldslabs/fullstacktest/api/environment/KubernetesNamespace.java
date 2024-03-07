package com.swirldslabs.fullstacktest.api.environment;

import com.swirldslabs.fullstacktest.api.Environment;
import com.swirldslabs.fullstacktest.api.annotation.ExtendWithK8sNamespace;
import org.junit.platform.commons.logging.Logger;
import org.junit.platform.commons.logging.LoggerFactory;

public class K8sNamespace implements Environment {
    private static final Logger logger = LoggerFactory.getLogger(K8sNamespace.class);
    public K8sNamespace(ExtendWithK8sNamespace annotation) {
        logger.info(() -> "created namespace");
    }

    @Override
    public void close() throws Throwable {
        logger.info(() -> "destroying namespace");
    }
}
