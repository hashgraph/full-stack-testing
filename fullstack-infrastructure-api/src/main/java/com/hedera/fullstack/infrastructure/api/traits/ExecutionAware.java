package com.hedera.fullstack.infrastructure.api.traits;

import java.io.InputStream;

public interface ExecutionAware {

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
