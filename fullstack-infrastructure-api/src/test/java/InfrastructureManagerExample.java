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

import com.hedera.fullstack.infrastructure.api.exceptions.DeploymentLimitReachedException;
import com.hedera.fullstack.infrastructure.api.exceptions.InfrastructureException;
import com.hedera.fullstack.infrastructure.api.exceptions.InvalidConfigurationException;
import com.hedera.fullstack.infrastructure.api.manager.InfrastructureManager;
import com.hedera.fullstack.infrastructure.api.model.NetworkDeployment;
import com.hedera.fullstack.infrastructure.api.model.WorkloadReplica;
import com.hedera.fullstack.infrastructure.api.model.mirrornode.MirrorNode;
import com.hedera.fullstack.infrastructure.api.model.mirrornode.component.Importer;
import com.hedera.fullstack.infrastructure.api.model.networknode.NetworkNode;
import com.hedera.fullstack.infrastructure.api.model.networknode.component.Node;
import com.hedera.fullstack.infrastructure.api.traits.ExecutionAware;
import java.nio.file.Path;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

/**
 * NOT FOR PRODUCTION USE, ONLY FOR DEMO PURPOSES
 * This code is NOT supposed to be used in any test or production code.
 * The only purpose of this code is to show how the API will be used and how pieces fit together
 */
public class InfrastructureManagerExample {

    public static void main(String[] args)
            throws ExecutionException, InterruptedException, DeploymentLimitReachedException, InfrastructureException,
                    InvalidConfigurationException {

        InfrastructureManager infrastructureManager = null;
        Future<NetworkDeployment> ndR = infrastructureManager.createNetworkDeploymentAsync(null);
        NetworkDeployment nd = ndR.get();

        WorkloadReplica<NetworkNode> networkNode0 = nd.workloadByIndex(NetworkNode.class, 0);
        WorkloadReplica<NetworkNode> networkNode1 = nd.workloadByIndex(NetworkNode.class, 1);
        Node node0 = networkNode0.getComponentByType(Node.class);
        Node node1 = networkNode1.getComponentByType(Node.class);

        node0.stop();
        // get config.txt from node0

        node0.retrieveFile(Path.of("/path/to/config.txt"));
        node1.retrieveFile(Path.of("/path/to/config.txt"));

        ExecutionAware.CommandResult commandResult0 = node0.exec("ls -l");
        // consume output streams
        commandResult0.stdout();
        commandResult0.stderr();

        ExecutionAware.CommandResult commandResult1 = node1.exec("ls -l");
        // consume output streams
        commandResult1.stdout();
        commandResult1.stderr();

        WorkloadReplica<MirrorNode> mirrorNode = nd.workloadByIndex(MirrorNode.class, 0);
        Importer importer = mirrorNode.getComponentByType(Importer.class);
    }
}
