package com.hedera.fullstack.example;/*
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import com.hedera.fullstack.base.api.version.SemanticVersion;
import com.hedera.fullstack.configuration.model.NetworkDeploymentConfiguration;
import com.hedera.fullstack.infrastructure.api.exceptions.InsufficientClusterResourcesException;
import com.hedera.fullstack.infrastructure.api.exceptions.InfrastructureException;
import com.hedera.fullstack.infrastructure.api.exceptions.InvalidConfigurationException;
import com.hedera.fullstack.infrastructure.api.exceptions.NetworkDeploymentNotFoundException;
import com.hedera.fullstack.infrastructure.api.manager.InfrastructureManager;
import com.hedera.fullstack.infrastructure.api.model.NetworkDeployment;
import com.hedera.fullstack.infrastructure.core.model.networknode.NetworkNode;
import com.hedera.fullstack.resource.generator.api.NodeDetails;
import com.hedera.fullstack.resource.generator.api.PlatformConfiguration;
import com.hedera.fullstack.resource.generator.api.ResourceUtils;

import java.io.IOException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

/**
 * NOT FOR PRODUCTION USE, ONLY FOR DEMO PURPOSES
 * This code is NOT supposed to be used in any test or production code.
 * The only purpose of this code is to show how the API will be used and how pieces fit together
 */
public class IntegrationExample {

    // This the JUNIT / CLI entry point
    public static void main(String[] args)
            throws ExecutionException, InterruptedException, InsufficientClusterResourcesException, InfrastructureException,
                    InvalidConfigurationException {

        // This the JUNIT / CLI entry point
        TestTookKit testTookKit = new TestTookKit();
        NetworkDeploymentConfiguration hederaNetworkNetworkDeploymentConfiguration =
                new NetworkDeploymentConfiguration();
        //                .setCPU(1)
        //                .setRAM(1, StorageUnits.GIGABYTES)
        //                .setNodeCount(1)
        //                .build(); // supplied by junit or cli

        // Step 1. Create the NetworkDeployment
        // who carries the software version, nmt version etc. ?
        NetworkDeployment networkDeployment = testTookKit.create(hederaNetworkNetworkDeploymentConfiguration);
        // should have
        // - Junit can fill in more stuff in the builder the config builder
        // - ip and names of the pods created
        // Should contain sanitized version of ips and pod names, should not container k8s specific stuff
        PlatformConfiguration.Builder platformConfigBuilder = networkDeployment.getPlatformConfigurationBuilder();
        // The Junit tests can add things in the platform config builder
        platformConfigBuilder.addNodeDetail(new NodeDetails("abc", "127.0.0.1"));
        platformConfigBuilder.addNodeDetail(new NodeDetails("abc", "127.0.0.1"));

        // Step 2. Configure the NetworkDeployment
        // testTookKit.configure(networkDeployment);

        // Step 3. Start the NetworkDeployment
        testTookKit.startNetworkDeployment(networkDeployment);

        // Step 4. Execute the tests
        //  we need the all the IP addresses and ports to create the hedera client
        var networkNode0 = networkDeployment.workloadByIndex(NetworkNode.class, 0);

        // deploymentTopology.get;
        // configure the hedera client and execute tests
        // networkNode0<>.getComponentByType()

        // Step 4.a may need to copy files to node

        // Step 5. Delete the network
        try {
            testTookKit.deleteNetworkDeployments(networkDeployment.getId());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /*
    a collection of classes not one
    - TestSuiteConfigurationExtension.preConstructTestInstance
       -> junit validations
       -> use ExtensionContext to carry forward information
    */
    private static class TestTookKit {

        InfrastructureManager infraManager;

        // This is invoked by the CLI or Junit
        public NetworkDeployment create(NetworkDeploymentConfiguration hederaEcosystemNetworkDeploymentConfiguration)
                throws ExecutionException, InterruptedException, InsufficientClusterResourcesException,
                InfrastructureException, InvalidConfigurationException {
            Future<NetworkDeployment> ecosystem =
                    infraManager.createNetworkDeploymentAsync(hederaEcosystemNetworkDeploymentConfiguration);

            return ecosystem.get();
        }

        public void configure(NetworkDeployment networkDeployment) {
            ResourceUtils resourceUtils = null;
            String version = null;

            String platformConfig =
                    resourceUtils.getPlatformConfiguration(networkDeployment.getNetworkDeploymentConfiguration());
            String platformSettings =
                    resourceUtils.getPlatformSettings(networkDeployment.getNetworkDeploymentConfiguration());
            String buildZipURL = resourceUtils.getBuildZipURL(SemanticVersion.ZERO);

            // Configuring the platform
            try {
                System.out.println("hello world");
                throw new IOException("hello world");
                // networkDeployment.putContentsFile(Component.NODE_SOFTWARE_POD, 1, Path.of("/app/config.txt"),
                // platformConfig);
                // networkDeployment.putContentsFile(Component.NODE_SOFTWARE_POD, 1, Path.of("/app/settings.txt"),
                // platformSettings);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }

        public void startNetworkDeployment(NetworkDeployment networkDeployment) {
            // Start the network
            try {
                networkDeployment.clusters();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

        public void deleteNetworkDeployments(String id) throws NetworkDeploymentNotFoundException {
            infraManager.deleteNetworkDeployment(id);
        }
    }
}
