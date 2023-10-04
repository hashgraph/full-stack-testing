package com.hedera.fullstack.junit.support.model;

import java.util.ArrayList;
import java.util.List;

public record PlatformConfiguration(List<ConfigurationValue> configurationValues) {

    public static class Builder {
        private List<ConfigurationValue> configurationValues = new ArrayList<>();

        public Builder configurationValues(List<ConfigurationValue> configurationValues) {
            this.configurationValues = configurationValues;
            return this;
        }

        public Builder addConfigurationValue(ConfigurationValue configurationValue) {
            this.configurationValues.add(configurationValue);
            return this;
        }

        public PlatformConfiguration build() {
            return new PlatformConfiguration(configurationValues);
        }
    }

}

