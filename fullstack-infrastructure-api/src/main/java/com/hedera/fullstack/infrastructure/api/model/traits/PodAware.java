package com.hedera.fullstack.infrastructure.api.model.traits;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.Optional;

public interface PodAware {
    void start();
    void stop();
    void restart();

    void getLogs();
    void getLogs(String containerName);

    File getFile(Path remotePath);
    File getFile(String containerName, Path remotePath);

    // gets from default container
    void putFile(File file, Path remotePath);
    void putFile(String containerName,File file, Path remotePath);

    // execute command and should return input and output streams
    CommandResult exec(String command);
    CommandResult exec(String container, String command);

    class CommandResult {
        private final InputStream stdout;
        private final InputStream stderr;

        public CommandResult(InputStream stdout, InputStream stderr) {
            this.stdout = stdout;
            this.stderr = stderr;
        }

        public InputStream getStdout() {
            return stdout;
        }

        public InputStream getStderr() {
            return stderr;
        }
    }
}
