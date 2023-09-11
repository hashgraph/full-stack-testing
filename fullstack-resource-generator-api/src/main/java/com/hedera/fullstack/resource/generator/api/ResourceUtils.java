package com.hedera.fullstack.resource.generator.api;

import com.hedera.fullstack.base.api.version.SemanticVersion;
import com.hedera.fullstack.infrastructure.api.NetworkDeployment;

public interface ResourceUtils {

    /*
    Versioning
     - FST should know about all versions of hedera releases
        - it should be backwards compatible upto a specified version
    */

    /*
    Actual logic will be service loaded from the platform
    */

    /*
     @Question: is this level of abstraction enough
     or do we want even more high level generic functions, i.e we should not even know about platform.txt and config.txt
     */
    // config.txt
     String getPlatformConfiguration(NetworkDeployment networkDeployment);

     // settings.txt
     String getPlatformSettings(NetworkDeployment networkDeployment);

     // using hedera api's 101 and 102
     String getBinaryNodeAddressBook(NetworkDeployment networkDeployment);

     String getHederaAppBootStrapProperties();
     String getHederaAppNodeProperties();

     String getBuildZipURL(SemanticVersion version);

 // how to get app specific properties

}
