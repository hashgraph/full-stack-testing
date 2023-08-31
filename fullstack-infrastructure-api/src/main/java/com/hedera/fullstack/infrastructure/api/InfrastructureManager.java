package com.hedera.fullstack.infrastructure.api;

import com.hedera.fullstack.infrastructure.api.model.Component;
import com.hedera.fullstack.infrastructure.api.model.HederaNetwork;
import com.hedera.fullstack.infrastructure.api.model.LogFile;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;


public interface InfrastructureManager {

    // TODO: Async return type
    HederaNetwork createInstance(HederaNetwork hederaNetwork);
    List<HederaNetwork> getInstances();
    HederaNetwork getInstance(String id);

    // TODO: Async return type
    void deleteInstance(String id);

    /* File operations */

    File getFile(Component component, int replica, String filePath) throws FileNotFoundException;
    void putFile(Component component, int replica, File file);

    String getFileContents(Component component, int replica,String path) throws FileNotFoundException;
    void putFileContents(Component component, int replica,String path, String fileContents) throws IOException;


    /* Logs */
    String getLogs(Component component, int replica, LogFile logfile);

    /* Component operations */
    //TODO: sync+async return type
    //TODO: is there a more eligant solution to specifying the replicaCount here?
    void startComponent(Component component, int replicaCount);
    void stopComponent(Component component, int replicaCount);
    void restartComponent(Component component, int replicaCount);



}

