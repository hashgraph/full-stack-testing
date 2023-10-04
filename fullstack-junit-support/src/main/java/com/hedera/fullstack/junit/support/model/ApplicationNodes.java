package com.hedera.fullstack.junit.support.model;

public record ApplicationNodes(int values, ResourceShape shape) {

    public static class Builder {
        private int value;
        private ResourceShape shape;

        public Builder value(int value) {
            this.value = value;
            return this;
        }

        public Builder shape(ResourceShape shape) {
            this.shape = shape;
            return this;
        }

        public ApplicationNodes build() {
            return new ApplicationNodes(value, shape);
        }
    }

}