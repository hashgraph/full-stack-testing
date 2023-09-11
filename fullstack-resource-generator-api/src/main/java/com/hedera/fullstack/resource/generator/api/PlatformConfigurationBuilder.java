package com.hedera.fullstack.resource.generator.api;

import java.util.ArrayList;
import java.util.List;

public class PlatformConfigurationBuilder {
    private final List<NodeDetails> nodeDetails;

    private PlatformConfigurationBuilder(Builder builder) {
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

        public PlatformConfigurationBuilder build() {
            return new PlatformConfigurationBuilder(this);
        }
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("PlatformConfigurationBuilder{");
        sb.append("nodeDetails=[");
        for (NodeDetails detail : nodeDetails) {
            sb.append("{name: ").append(detail.getName()).append(", ipAddress: ").append(detail.getIpAddress()).append("}, ");
        }
        sb.append("]}");
        return sb.toString();
    }

    public static void main(String[] args) {
        NodeDetails node1 = new NodeDetails.Builder()
                .setName("Node1")
                .setIpAddress("192.168.1.1")
                .build();

        NodeDetails node2 = new NodeDetails.Builder()
                .setName("Node2")
                .setIpAddress("192.168.1.2")
                .build();

        PlatformConfigurationBuilder config = new PlatformConfigurationBuilder.Builder()
                .addNodeDetail(node1)
                .addNodeDetail(node2)
                .build();

        System.out.println(config);
    }
}