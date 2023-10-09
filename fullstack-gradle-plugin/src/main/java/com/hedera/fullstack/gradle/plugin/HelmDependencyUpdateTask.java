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

package com.hedera.fullstack.gradle.plugin;

import com.hedera.fullstack.helm.client.HelmClient;
import com.hedera.fullstack.helm.client.HelmClientBuilder;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import org.gradle.api.DefaultTask;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.Optional;
import org.gradle.api.tasks.TaskAction;
import org.gradle.api.tasks.options.Option;

public abstract class HelmDependencyUpdateTask extends DefaultTask {
    @Input
    @Option(option = "chartName", description = "The name of the chart to run the dependency update against")
    public abstract Property<String> getChartName();

    @Input
    @Optional
    @Option(option = "workingDirectory", description = "The working directory to run the dependency update from")
    public abstract Property<String> getWorkingDirectory();

    @TaskAction
    void dependencyUpdate() {
        HelmClientBuilder helmClientBuilder = HelmClient.builder();
        try {
            final String chartName = getChartName().getOrNull();
            Objects.requireNonNull(chartName, "chartName must be set");
            final String workingDirectory = getWorkingDirectory().getOrNull();
            if (workingDirectory != null && !workingDirectory.isEmpty() && !workingDirectory.isBlank()) {
                Path workingDirectoryPath = Paths.get(workingDirectory);
                helmClientBuilder.workingDirectory(workingDirectoryPath);
            }
            HelmClient helmClient = helmClientBuilder.build();
            helmClient.dependencyUpdate(chartName);
        } catch (Exception e) {
            this.getProject()
                    .getLogger()
                    .error(
                            "HelmDependencyUpdateTask.dependencyUpdate() An ERROR occurred while running the dependency update: ",
                            e);
            throw e;
        }
    }
}
