package com.hedera.fullstack.infrastructure.api.model;

import com.hedera.fullstack.infrastructure.api.NetworkDeployment;
import com.hedera.fullstack.infrastructure.api.model.networknode.NetworkNode;

public class Main {
    public static void main(String[] args) {

        NetworkDeployment nd = null;

        //var networkNode = nd.workloadByType(NetworkNode.class);


        //this represents a replica of networkNode0
        var networkNode0 = nd.workloadByIndex(NetworkNode.class,0);

        // networkNode0 -> allows to me to access components

        //var networkNode0 = networkNode.replicas().get(0);
        //var x = networkNode0.findComponentByType(null);
//        if (x instanceof PodAware) {
//            x.getFile(Path.of("/opt/hgcapp/config.txt"));
//        }
    }
}
