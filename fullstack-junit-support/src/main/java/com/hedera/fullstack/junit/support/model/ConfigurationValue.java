package com.hedera.fullstack.junit.support.model;

public record ConfigurationValue(String name, String value) {

    public static class Builder {
        private String name;
        private String value;

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder value(String value) {
            this.value = value;
            return this;
        }

        public ConfigurationValue build() {
            return new ConfigurationValue(name, value);
        }
    }

}