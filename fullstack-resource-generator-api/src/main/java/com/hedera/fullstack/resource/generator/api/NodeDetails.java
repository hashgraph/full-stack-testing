package com.hedera.fullstack.resource.generator.api;

public class NodeDetails {
    private final String name;
    private final String ipAddress;

    private NodeDetails(Builder builder) {
        this.name = builder.name;
        this.ipAddress = builder.ipAddress;
    }

    public String getName() {
        return name;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public static class Builder {
        private String name;
        private String ipAddress;

        public Builder setName(String name) {
            this.name = name;
            return this;
        }

        public Builder setIpAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public NodeDetails build() {
            return new NodeDetails(this);
        }
    }

    @Override
    public String toString() {
        return "NodeDetails{" +
                "name='" + name + '\'' +
                ", ipAddress='" + ipAddress + '\'' +
                '}';
    }

}