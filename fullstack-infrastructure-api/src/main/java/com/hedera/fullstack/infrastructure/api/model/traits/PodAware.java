/*
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

package com.hedera.fullstack.infrastructure.api.model.traits;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Path;

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

    void putFile(String containerName, File file, Path remotePath);

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
