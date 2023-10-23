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

package com.hedera.fullstack.infrastructure.api.model;

import com.hedera.fullstack.infrastructure.api.model.traits.Labeled;
import com.hedera.fullstack.model.Topology;

// only individual classes will implement PodAware and ServiceAware
public interface Component extends Labeled {

    // lifecycle
    // this should be mostly done by helm
    default void init() {}

    default void configure(Topology deploymentTopology) {}

    default void destroy() {}
}
