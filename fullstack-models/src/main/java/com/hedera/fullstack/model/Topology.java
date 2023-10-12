package com.hedera.fullstack.model;

import com.hedera.fullstack.base.api.units.StorageUnits;

public class Topology {
    /*
    This will closely mirror helm values.yaml
    - component and their replicas counts
       - configuration for each replicas
    */

    private int nodeCount;
    private int RAM;
    private int CPU;

    public int getNodeCount() {
        return nodeCount;
    }

    public int getRAM() {
        return RAM;
    }

    public int getCPU() {
        return CPU;
    }

    public static class Builder {
        private int nodeCount;
        private int RAM;
        private int CPU;

        public Builder setNodeCount(int nodeCount) {
            this.nodeCount = nodeCount;
            return this;
        }

        public Builder setRAM(int RAM, StorageUnits units) {
            if (units == StorageUnits.GIGABYTES) {
                this.RAM = RAM * 1023 * 1024 * 1024;
            }
            return this;
        }

        public Builder setCPU(int CPU) {
            this.CPU = CPU;
            return this;
        }

        public Topology build() {
            Topology topology = new Topology();
            topology.nodeCount = this.nodeCount;
            topology.RAM = this.RAM;
            topology.CPU = this.CPU;
            return topology;
        }
    }

    @Override
    public String toString() {
        return "Topology{" +
                "nodeCount=" + nodeCount +
                ", RAM=" + RAM +
                ", CPU=" + CPU +
                '}';
    }
}
