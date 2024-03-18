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

package com.hedera.fullstack.resource.generator.api;

import java.util.ArrayList;
import java.util.List;

public class PlatformConfiguration {
    private final List<NodeDetails> nodeDetails;

    private PlatformConfiguration(Builder builder) {
        this.nodeDetails = builder.nodeDetails;
    }

    public List<NodeDetails> getNodeDetails() {
        return nodeDetails;
    }

    public static class Builder {
        private List<NodeDetails> nodeDetails;

        public Builder() {
            this.nodeDetails = new ArrayList<>();
        }

        public Builder addNodeDetail(NodeDetails detail) {
            this.nodeDetails.add(detail);
            return this;
        }

        public Builder addNodeDetails(List<NodeDetails> details) {
            this.nodeDetails.addAll(details);
            return this;
        }

        public PlatformConfiguration build() {
            return new PlatformConfiguration(this);
        }
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("PlatformConfigurationBuilder{");
        sb.append("nodeDetails=[");
        for (NodeDetails detail : nodeDetails) {
            sb.append("{name: ")
                    .append(detail.name())
                    .append(", ipAddress: ")
                    .append(detail.ipAddress())
                    .append("}, ");
        }
        sb.append("]}");
        return sb.toString();
    }
}
