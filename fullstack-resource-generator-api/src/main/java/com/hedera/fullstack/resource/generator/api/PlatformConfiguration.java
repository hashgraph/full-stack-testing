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
            sb.append("{name: ").append(detail.name()).append(", ipAddress: ").append(detail.ipAddress()).append("}, ");
        }
        sb.append("]}");
        return sb.toString();
    }
}