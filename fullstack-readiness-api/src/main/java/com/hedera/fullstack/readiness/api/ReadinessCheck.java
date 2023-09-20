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

package com.hedera.fullstack.readiness.api;

import com.hedera.fullstack.test.toolkit.api.model.infrastructure.NodeSoftwarePodNode;
import com.hedera.fullstack.test.toolkit.api.model.infrastructure.NetworkDeployment;
import com.hedera.fullstack.test.toolkit.api.model.infrastructure.Node;
import java.time.Duration;

@FunctionalInterface
public interface ReadinessCheck {
    Duration DEFAULT_CHECK_INTERVAL = Duration.ofSeconds(1);
    Duration DEFAULT_CHECK_TIMEOUT = Duration.ofSeconds(60);

    boolean ready(NetworkDeployment deployment);

    default Duration checkInterval() {
        return DEFAULT_CHECK_INTERVAL;
    }

    default Duration checkTimeout() {
        return DEFAULT_CHECK_TIMEOUT;
    }

    default boolean appliesTo(Class<? extends Node<?>> nodeClass) {
        return NodeSoftwarePodNode.class.isAssignableFrom(nodeClass);
    }
}
