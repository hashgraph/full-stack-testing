import com.hedera.fullstack.base.api.units.StorageUnits;
import com.hedera.fullstack.base.api.version.SemanticVersion;
import com.hedera.fullstack.model.INSTALL_TYPE;
import com.hedera.fullstack.infrastructure.api.InfrastructureManager;
import com.hedera.fullstack.model.Component;
import com.hedera.fullstack.infrastructure.api.NetworkDeployment;
import com.hedera.fullstack.model.NetworkDeploymentModel;
import com.hedera.fullstack.model.Topology;
import com.hedera.fullstack.resource.generator.api.NodeDetails;
import com.hedera.fullstack.resource.generator.api.PlatformConfiguration;
import com.hedera.fullstack.resource.generator.api.ResourceUtils;

import java.io.IOException;
import java.nio.file.Path;

/*
 This code is not supposed to be used
 The only purpose of this code is to show how the API will be used and how pieces fit together
 */
public class IntegrationExample {

    // This the JUNIT / CLI entry point
    public static void main(String[] args) {

        // This the JUNIT / CLI entry point
        TestTookKit testTookKit = new TestTookKit();
        Topology hederaNetworkTopology = new Topology.Builder()
                .setCPU(1)
                .setRAM(1, StorageUnits.GIGABYTES)
                .setNodeCount(1)
                .build(); // supplied by junit or cli

        // Step 1. Create the NetworkDeployment
        // who carries the software version, nmt version etc. ?
        NetworkDeployment networkDeployment = testTookKit.create(hederaNetworkTopology);
        // should have
        // - Junit can fill in more stuff in the builder the config builder
        // - ip and names of the pods created
        // Should contain sanitized version of ips and pod names, should not container k8s specific stuff
        PlatformConfiguration.Builder platformConfigBuilder = networkDeployment.getPlatformConfigurationBuilder();
        // The Junit tests can add things in the platform config builder
        platformConfigBuilder.addNodeDetail(new NodeDetails("abc","127.0.0.1"));
        platformConfigBuilder.addNodeDetail(new NodeDetails("abc","127.0.0.1"));

        // Step 2. Configure the NetworkDeployment
        //testTookKit.configure(networkDeployment);

        // Step 3. Start the NetworkDeployment
        testTookKit.startNetworkDeployment(networkDeployment);

        // Step 4. Execute the tests
        //  we need the all the IP addresses and ports to create the hedera client
        var deploymentTopology = networkDeployment.getDeploymentTopology();
        deploymentTopology.getIPAddress(Component.NODE_SOFTWARE_POD, 1);
        // configure the hedera client and execute tests

        // Step 4.a may need to copy files to node

        // Step 5. Delete the network
        try {
            testTookKit.deleteNetworkDeployments(networkDeployment.getId());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static class TestTookKit {
        InfrastructureManager infraManager;

        // This is invoked by the CLI or Junit
        public NetworkDeployment create(Topology hederaEcosystemTopology) {
            NetworkDeployment ecosystem = infraManager.createNetworkDeployment(hederaEcosystemTopology, INSTALL_TYPE.DIRECT_INSTALL);
            return  ecosystem;
        }

        public void configure(NetworkDeploymentModel networkDeployment) {
            ResourceUtils resourceUtils = null;
            String version = null;

            String platformConfig = resourceUtils.getPlatformConfiguration(networkDeployment);
            String platformSettings = resourceUtils.getPlatformSettings(networkDeployment);
            String buildZipURL = resourceUtils.getBuildZipURL(SemanticVersion.ZERO);

            // Configuring the platform
            try {
                System.out.println("hello world");
                throw new IOException("hello world");
                //networkDeployment.putContentsFile(Component.NODE_SOFTWARE_POD, 1, Path.of("/app/config.txt"), platformConfig);
                //networkDeployment.putContentsFile(Component.NODE_SOFTWARE_POD, 1, Path.of("/app/settings.txt"), platformSettings);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }

        public void startNetworkDeployment(NetworkDeployment networkDeployment) {
            // Start the network
            try {
                networkDeployment.startComponent(Component.NODE_SOFTWARE_POD, 1);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

        public void deleteNetworkDeployments(String id) {
            infraManager.deleteNetworkDeployment(id);
        }
    }
}
