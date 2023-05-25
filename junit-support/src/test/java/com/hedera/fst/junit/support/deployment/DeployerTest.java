package com.hedera.fst.junit.support.deployment;

import org.junit.jupiter.api.Test;

class DeployerTest {
    @Test
    void testDeployFromResource() throws InterruptedException {
        Deployer deployer = new Deployer();
        deployer.deployFromResource("/fst-deployment.yaml", "fst-ns");

    }

    @Test
    void testDeleteFromResource() {
        Deployer deployer = new Deployer();
        deployer.deleteFromResource("/fst-deployment.yaml", "fst-ns");
    }
}