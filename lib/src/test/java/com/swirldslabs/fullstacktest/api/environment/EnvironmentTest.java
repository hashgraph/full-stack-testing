package com.swirldslabs.fullstacktest.api.environment;

import com.swirldslabs.fullstacktest.api.annotation.ExtendWithK8sNamespace;
import org.junit.jupiter.api.Test;
import org.junit.platform.commons.logging.Logger;
import org.junit.platform.commons.logging.LoggerFactory;

public class EnvironmentTest {
    private static final Logger logger = LoggerFactory.getLogger(EnvironmentTest.class);
    @Test
    void test(@ExtendWithK8sNamespace Environment environment) {
        logger.info(() -> "env: " + environment);
    }
}
