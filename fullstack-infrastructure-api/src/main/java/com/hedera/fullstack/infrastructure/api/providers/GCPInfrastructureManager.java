package com.hedera.fullstack.infrastructure.api.providers;

import com.hedera.fullstack.infrastructure.api.InfrastructureManager;
import com.hedera.fullstack.infrastructure.api.model.LogFile;
import com.hedera.fullstack.infrastructure.api.model.Component;
import com.hedera.fullstack.infrastructure.api.model.HederaNetwork;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;

public class GCPInfrastructureManager implements InfrastructureManager {

    @Override
    public HederaNetwork createInstance(HederaNetwork hederaNetwork) {
        return null;
    }

    @Override
    public List<HederaNetwork> getInstances() {
        return null;
    }

    @Override
    public HederaNetwork getInstance(String id) {
        return null;
    }

    @Override
    public void deleteInstance(String id) {

    }

    @Override
    public File getFile(Component component, int replica, String filePath) throws FileNotFoundException {
        return null;
    }

    @Override
    public void putFile(Component component, int replica, File file) {

    }

    @Override
    public String getFileContents(Component component, int replica, String path) throws FileNotFoundException {
        return null;
    }

    @Override
    public void putFileContents(Component component, int replica, String path, String fileContents) throws IOException {

    }

    @Override
    public String getLogs(Component component, int replica, LogFile logfile) {
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
