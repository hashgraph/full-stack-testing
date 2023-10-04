package com.hedera.fullstack.junit.support.model;

public record Topology(ApplicationNodes applicationNodes, PlatformConfiguration platformConfiguration, PlatformApplication platformApplication) {

    public static class Builder {
        private ApplicationNodes applicationNodes;
        private PlatformConfiguration platformConfiguration;
        private PlatformApplication platformApplication;

        public Builder applicationNodes(ApplicationNodes applicationNodes) {
            this.applicationNodes = applicationNodes;
            return this;
        }

        public Builder platformConfiguration(PlatformConfiguration platformConfiguration) {
            this.platformConfiguration = platformConfiguration;
            return this;
        }

        public Builder platformApplication(PlatformApplication platformApplication) {
            this.platformApplication = platformApplication;
            return this;
        }

        public Topology build() {
            return new Topology(applicationNodes, platformConfiguration, platformApplication);
        }
    }

}
