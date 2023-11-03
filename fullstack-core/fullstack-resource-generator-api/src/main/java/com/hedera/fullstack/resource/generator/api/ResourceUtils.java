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

package com.hedera.fullstack.resource.generator.api;

import com.hedera.fullstack.base.api.version.SemanticVersion;
import com.hedera.fullstack.configuration.model.NetworkDeploymentConfiguration;
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
    PlatformConfiguration getPlatformConfigurationBuilder(NetworkDeploymentConfiguration networkDeployment);

    String getPlatformConfiguration(NetworkDeploymentConfiguration networkDeployment);

    // settings.txt
    String getPlatformSettings(NetworkDeploymentConfiguration networkDeployment);

    // using hedera api's 101 and 102
    String getBinaryNodeAddressBook(NetworkDeploymentConfiguration networkDeployment);

    String getHederaAppBootStrapProperties();

    String getHederaAppNodeProperties();

    String getBuildZipURL(SemanticVersion version);

    // how to get app specific properties

}
