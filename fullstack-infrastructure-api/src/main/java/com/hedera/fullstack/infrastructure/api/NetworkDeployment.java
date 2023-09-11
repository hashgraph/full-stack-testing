package com.hedera.fullstack.infrastructure.api;


import com.hedera.fullstack.infrastructure.api.model.Component;
import com.hedera.fullstack.infrastructure.api.model.DeploymentTopology;
import com.hedera.fullstack.infrastructure.api.model.LogFile;
import com.hedera.fullstack.infrastructure.api.model.Topology;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Path;

/**
 Represents a hedera network / deployment / infrastructure
 The hedera infrastructure means
  - hedera node
  - sidecars
  - minio
  - mirror node
  - mirror node explorer

**/
public interface NetworkDeployment {

     //- config builder
     //- ip address of components
     //- no k8s details


     String getId();
     String getName();
     Topology getTopology();
     DeploymentTopology getDeploymentTopology();

     /* File operations */
     File getFile(Component component, int replica, String filePath) throws FileNotFoundException;

     void putFile(Component component, int replica, File file, Path remotePath) throws IOException;
     void putFile(Component component, int replica, String fileContents, Path remotePath) throws IOException;

     String getFileContents(Component component, int replica,String path) throws FileNotFoundException;
     void putContentsFile(Component component, int replica,Path path, String fileContents) throws IOException;

     /* Logs */
     String getLogs(Component component, int replica, LogFile logfile);

     /* Component operations */
     //TODO: sync+async return type
     //TODO: is there a more elegant solution to specifying the replicaCount here?
     void startComponent(Component component, int replicaCount) throws Exception;
     void stopComponent(Component component, int replicaCount) throws Exception;
     void restartComponent(Component component, int replicaCount)  throws Exception;

}

