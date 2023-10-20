package com.hedera.fullstack.infrastructure.api.model;

import com.hedera.fullstack.infrastructure.api.InfrastructureManager;
import com.hedera.fullstack.infrastructure.api.NetworkDeployment;
import com.hedera.fullstack.infrastructure.api.model.mirrornode.MirrorNode;
import com.hedera.fullstack.infrastructure.api.model.mirrornode.components.Importer;
import com.hedera.fullstack.infrastructure.api.model.networknode.NetworkNode;
import com.hedera.fullstack.infrastructure.api.model.networknode.components.Node;
import com.hedera.fullstack.infrastructure.api.model.traits.PodAware;
import com.hedera.fullstack.model.InstallType;

import java.nio.file.Path;
import java.util.List;

public class Main {

    public static void main(String[] args) {

        InfrastructureManager infrastructureManager = null;
        NetworkDeployment nd = infrastructureManager.createNetworkDeployment(null, InstallType.DIRECT_INSTALL);

        WorkloadReplica<NetworkNode> networkNode0 = nd.workloadByIndex(NetworkNode.class,0);
        WorkloadReplica<NetworkNode> networkNode1 = nd.workloadByIndex(NetworkNode.class,0);
        Node node0 = networkNode0.getComponentByType(Node.class);
        Node node1 = networkNode1.getComponentByType(Node.class);

       // get config.txt from node0
       node0.getFile(Path.of("/path/to/config.txt"));
       node1.getFile(Path.of("/path/to/config.txt"));

        PodAware.CommandResult commandResult0 = node0.exec("ls -l");
        //consume output streams
        commandResult0.getStdout();
        commandResult0.getStderr();

        PodAware.CommandResult commandResult1 = node1.exec("ls -l");
        //consume output streams
        commandResult1.getStdout();
        commandResult1.getStderr();


        WorkloadReplica<MirrorNode> mirrorNode = nd.workloadByIndex(MirrorNode.class,0);
        Importer importer = mirrorNode.getComponentByType(Importer.class);

    }

}
