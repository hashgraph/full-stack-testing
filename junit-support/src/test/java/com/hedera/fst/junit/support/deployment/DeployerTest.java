package com.hedera.fst.junit.support.deployment;

import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

@TestMethodOrder(OrderAnnotation.class)
class DeployerTest {
    @Test
    @Order(1)
    void testDeployFromResource() throws InterruptedException {
        Deployer deployer = new Deployer();
        deployer.deployFromResource("/fst-deployment.yaml", "fst-ns");

    }

    @Test
    @Order(2)
    void testDeleteFromResource() throws InterruptedException {
        Deployer deployer = new Deployer();
        deployer.deleteFromResource("/fst-deployment.yaml", "fst-ns");
    }
}