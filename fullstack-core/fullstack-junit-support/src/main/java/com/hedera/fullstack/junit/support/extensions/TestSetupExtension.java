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

package com.hedera.fullstack.junit.support.extensions;

import com.hedera.fullstack.junit.support.annotations.application.ApplicationNodes;
import com.hedera.fullstack.junit.support.annotations.application.PlatformApplication;
import com.hedera.fullstack.junit.support.annotations.application.PlatformConfiguration;
import com.hedera.fullstack.junit.support.model.ConfigurationValue;
import com.hedera.fullstack.junit.support.model.NetworkDeploymentConfiguration;
import com.hedera.fullstack.junit.support.model.ResourceShape;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

/**
 * Handles the individual test setup, configuration, and resource deployment (if applicable).
 */
public class TestSetupExtension implements BeforeEachCallback {
    /**
     * Callback that is invoked <em>before</em> each test is executed.
     *
     * @param context the current extension context; never {@code null}
     * @throws Exception if an error occurs during callback execution.
     *
     * <p><img alt="annotation processing call flow" src="annotation-processing.drawio.png"/></p>
     */
    @Override
    public void beforeEach(final ExtensionContext context) throws Exception {

        Optional<Method> testMethod = context.getTestMethod();

        if (testMethod.isPresent()) {
            // FUTURE: add support for NamedApplicationNodes
            ApplicationNodes applicationNodes = testMethod.get().getAnnotation(ApplicationNodes.class);
            PlatformApplication platformApplication = testMethod.get().getAnnotation(PlatformApplication.class);
            PlatformConfiguration platformConfigurations = testMethod.get().getAnnotation(PlatformConfiguration.class);

            // Convert the annotations to model class objects
            com.hedera.fullstack.junit.support.model.ApplicationNodes.Builder appNodesBuilder =
                    new com.hedera.fullstack.junit.support.model.ApplicationNodes.Builder();
            if (applicationNodes != null) {
                appNodesBuilder
                        .value(applicationNodes.value())
                        .shape(new ResourceShape.Builder()
                                .cpuInMillis(applicationNodes.shape().cpuInMillis())
                                .build());
            }

            com.hedera.fullstack.junit.support.model.PlatformApplication.Builder platformAppBuilder =
                    new com.hedera.fullstack.junit.support.model.PlatformApplication.Builder();
            if (platformApplication != null) {
                platformAppBuilder
                        .fileName(platformApplication.fileName())
                        .parameters(
                                Arrays.stream(platformApplication.parameters()).toList());
            }

            com.hedera.fullstack.junit.support.model.PlatformConfiguration.Builder platformConfigBuilder =
                    new com.hedera.fullstack.junit.support.model.PlatformConfiguration.Builder();
            if (platformConfigurations != null) {
                Stream.of(platformConfigurations.value())
                        .forEach(config ->
                                // FUTURE: support values[]
                                platformConfigBuilder.addConfigurationValue(
                                        new ConfigurationValue(config.name(), config.value())));
            }

            // Topology holds all the information needed to provision
            NetworkDeploymentConfiguration networkDeploymentConfiguration = new NetworkDeploymentConfiguration.Builder()
                    .applicationNodes(appNodesBuilder.build())
                    .platformApplication(platformAppBuilder.build())
                    .platformConfiguration(platformConfigBuilder.build())
                    .build();
            // FUTURE: provision this topology using test tool kit here
        }
    }
}
