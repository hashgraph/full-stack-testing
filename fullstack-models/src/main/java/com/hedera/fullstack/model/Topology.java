package com.hedera.fullstack.model;

import com.hedera.fullstack.base.api.units.StorageUnits;

import java.util.List;

public class Topology {

    private List<Node> nodes;

    public List<Node> getNodes() {
        return nodes;
    }

    public void setNodes(List<Node> nodes) {
        this.nodes = nodes;
    }


//        public Topology.Builder setRAM(int RAM, StorageUnits units) {
//            if (units == StorageUnits.GIGABYTES) {
//                this.RAM = RAM * 1024 * 1024 * 1024;
//            } else if (units == StorageUnits.MEGABYTES) {
//                this.RAM = RAM * 1024 * 1024;
//            } else if (units == StorageUnits.KILOBYTES) {
//                this.RAM = RAM * 1024;
//            } else {
//                this.RAM = RAM;
//            }
//            return this;
//        }

}
