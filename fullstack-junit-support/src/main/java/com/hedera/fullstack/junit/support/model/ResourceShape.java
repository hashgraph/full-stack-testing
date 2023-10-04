package com.hedera.fullstack.junit.support.model;

public record ResourceShape(float cpuInMillis) {

    public static class Builder {
        private float cpuInMillis;

        public Builder cpuInMillis(float cpuInMillis) {
            this.cpuInMillis = cpuInMillis;
            return this;
        }

        public ResourceShape build() {
            return new ResourceShape(cpuInMillis);
        }
    }

}