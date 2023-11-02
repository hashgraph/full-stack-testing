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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class Importer implements Component, ServiceAware, LogAware {

    @Override
    public Map<String, InetSocketAddress> getEndpoints() {
        return null;
    }

    @Override
    public List<LogEntry> getLogs(int tailLines) {
        return null;
    }

    @Override
    public List<LogEntry> getLogs(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        return null;
    }

    @Override
    public List<LogEntry> searchLogs(LocalDateTime startDateTime, LocalDateTime endDateTime, String searchQuery) {
        return null;
    }
}
