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

package com.hedera.fullstack.infrastructure.api.model.mirrornode.component;

import com.hedera.fullstack.infrastructure.api.model.Component;
import com.hedera.fullstack.infrastructure.api.traits.LogAware;
import com.hedera.fullstack.infrastructure.api.traits.ServiceAware;

import java.net.InetSocketAddress;
import java.util.Map;

public class Importer implements Component, ServiceAware, LogAware {

    @Override
    public void getLogs() {

    }

    @Override
    public void getLogs(String containerName) {

    }

    @Override
    public Map<String, InetSocketAddress> getEndpoints() {
        return null;
    }
}
