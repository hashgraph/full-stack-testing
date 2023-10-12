package com.hedera.fullstack.infrastructure.api.providers;

import com.hedera.fullstack.infrastructure.api.NetworkDeployment;
import com.hedera.fullstack.model.Component;
import com.hedera.fullstack.model.DeploymentTopology;
import com.hedera.fullstack.model.Topology;
import com.hedera.fullstack.resource.generator.api.PlatformConfiguration;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Path;

/*
 Wrapper object which has the HederaNetwork + k8s details inside it
*/
public class HederaNetworkK8s implements NetworkDeployment {

    @Override
    public String getId() {
        return null;
    }

    @Override
    public String getName() {
        return null;
    }

    @Override
    public Topology getTopology() {
        return null;
    }

    @Override
    public DeploymentTopology getDeploymentTopology() {
        return null;
    }

    @Override
    public PlatformConfiguration.Builder getPlatformConfigurationBuilder() {
        return null;
    }

    @Override
    public File getFile(Component component, int replica, String filePath) throws FileNotFoundException {
        return null;
    }

    @Override
    public void putFile(Component component, int replica, File file, Path remotePath) throws IOException {

    }

    @Override
    public void putFile(Component component, int replica, String fileContents, Path remotePath) throws IOException {

    }

    @Override
    public String getFileContents(Component component, int replica, String path) throws FileNotFoundException {
        return null;
    }

    @Override
    public void putContentsFile(Component component, int replica, Path path, String fileContents) throws IOException {

    }

    @Override
    public String getLogs(Component component, int replica) {
        return null;
    }

    @Override
    public void startComponent(Component component, int replicaCount) {

    }

    @Override
    public void stopComponent(Component component, int replicaCount) {

    }

    @Override
    public void restartComponent(Component component, int replicaCount) {

    }
}
