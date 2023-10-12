package com.hedera.fullstack.resource.generator.api;

public record NodeDetails(String name, String ipAddress) {

    public NodeDetails(String name, String ipAddress) {
        this.name = name;
        this.ipAddress = ipAddress;
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
            return new NodeDetails(this.name, this.ipAddress);
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