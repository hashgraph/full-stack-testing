package com.hedera.fullstack.infrastructure.api.model.networknode.components;

import com.hedera.fullstack.infrastructure.api.model.Component;
import com.hedera.fullstack.infrastructure.api.model.Endpoint;
import com.hedera.fullstack.infrastructure.api.model.traits.PodAware;
import com.hedera.fullstack.infrastructure.api.model.traits.ServiceAware;

import java.io.File;
import java.nio.file.Path;
import java.util.List;

class Node implements Component, PodAware, ServiceAware {

    @Override
    public void start() {

    }

    @Override
    public void stop() {

    }

    @Override
    public void restart() {

    }

    @Override
    public void getLogs() {

    }

    @Override
    public void getLogs(String containerName) {

    }

    @Override
    public File getFile(Path remotePath) {
        return null;
    }

    @Override
    public File getFile(String containerName, Path remotePath) {
        return null;
    }

    @Override
    public void putFile(File file, Path remotePath) {

    }

    @Override
    public void putFile(String containerName, File file, Path remotePath) {

    }

    @Override
    public List<Endpoint> getEndpoints() {
        return null;
    }
}
