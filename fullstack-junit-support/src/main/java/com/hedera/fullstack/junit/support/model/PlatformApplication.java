package com.hedera.fullstack.junit.support.model;

import java.util.ArrayList;
import java.util.List;

public record PlatformApplication(String fileName, List<String> parameters) {

    public static class Builder {
        private String fileName;
        private List<String> parameters = new ArrayList<>();

        public Builder fileName(String fileName) {
            this.fileName = fileName;
            return this;
        }

        public Builder parameters(List<String> parameters) {
            this.parameters = parameters;
            return this;
        }

        public Builder addParameter(String parameter) {
            this.parameters.add(parameter);
            return this;
        }

        public PlatformApplication build() {
            return new PlatformApplication(fileName, parameters);
        }
    }

}
