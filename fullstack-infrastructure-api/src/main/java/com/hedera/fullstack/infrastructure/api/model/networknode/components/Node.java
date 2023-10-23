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

package com.hedera.fullstack.infrastructure.api.model.networknode.components;

import com.hedera.fullstack.infrastructure.api.model.Component;
import com.hedera.fullstack.infrastructure.api.model.Endpoint;
import com.hedera.fullstack.infrastructure.api.model.traits.PodAware;
import com.hedera.fullstack.infrastructure.api.model.traits.ServiceAware;
import java.io.File;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

public class Node implements Component, PodAware, ServiceAware {

    @Override
    public void start() {}

    @Override
    public void stop() {}

    @Override
    public void restart() {}

    @Override
    public void getLogs() {}

    @Override
    public void getLogs(String containerName) {}

    @Override
    public File getFile(Path remotePath) {
        return null;
    }

    @Override
    public File getFile(String containerName, Path remotePath) {
        return null;
    }

    @Override
    public void putFile(File file, Path remotePath) {}

    @Override
    public void putFile(String containerName, File file, Path remotePath) {}

    @Override
    public CommandResult exec(String command) {
        return null;
    }

    @Override
    public CommandResult exec(String container, String command) {
        return null;
    }

    @Override
    public List<Endpoint> getEndpoints() {
        return null;
    }

    @Override
    public Map<String, String> labels() {
        return null;
    }
}
