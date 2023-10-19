package com.hedera.fullstack.infrastructure.api.model.traits;

import java.io.File;
import java.nio.file.Path;

public interface PodAware {
    void start();
    void stop();
    void restart();

    void getLogs();
    void getLogs(String containerName);

    // gets from default container
    File getFile(Path remotePath);
    File getFile(String containerName, Path remotePath);

    // gets from default container
    void putFile(File file, Path remotePath);
    void putFile(String containerName,File file, Path remotePath);
}
