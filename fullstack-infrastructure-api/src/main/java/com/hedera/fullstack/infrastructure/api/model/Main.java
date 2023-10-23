/*
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

public class Main {

    public static void main(String[] args) {

        InfrastructureManager infrastructureManager = null;
        NetworkDeployment nd = infrastructureManager.createNetworkDeployment(null, InstallType.DIRECT_INSTALL);

        WorkloadReplica<NetworkNode> networkNode0 = nd.workloadByIndex(NetworkNode.class, 0);
        WorkloadReplica<NetworkNode> networkNode1 = nd.workloadByIndex(NetworkNode.class, 0);
        Node node0 = networkNode0.getComponentByType(Node.class);
        Node node1 = networkNode1.getComponentByType(Node.class);

        // get config.txt from node0
        node0.getFile(Path.of("/path/to/config.txt"));
        node1.getFile(Path.of("/path/to/config.txt"));

        PodAware.CommandResult commandResult0 = node0.exec("ls -l");
        // consume output streams
        commandResult0.getStdout();
        commandResult0.getStderr();

        PodAware.CommandResult commandResult1 = node1.exec("ls -l");
        // consume output streams
        commandResult1.getStdout();
        commandResult1.getStderr();

        WorkloadReplica<MirrorNode> mirrorNode = nd.workloadByIndex(MirrorNode.class, 0);
        Importer importer = mirrorNode.getComponentByType(Importer.class);
    }
}
