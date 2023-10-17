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
import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.model.install.InstallChartOptionsBuilder;
import com.hedera.fullstack.helm.client.model.release.ReleaseItem;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.gradle.api.DefaultTask;
import org.gradle.api.provider.Property;
import org.gradle.api.provider.SetProperty;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.Optional;
import org.gradle.api.tasks.TaskAction;
import org.gradle.api.tasks.options.Option;

public abstract class HelmInstallChartTask extends DefaultTask {
    @Input
    @Option(option = "chart", description = "The name of the chart to install")
    public abstract Property<String> getChart();

    @Input
    @Optional
    @Option(option = "createNamespace", description = "Create the release namespace if not present")
    public abstract Property<Boolean> getCreateNamespace();

    @Input
    @Optional
    @Option(option = "namespace", description = "The namespace to use when installing the chart")
    public abstract Property<String> getNamespace();

    @Input
    @Option(option = "release", description = "The name of the release to install")
    public abstract Property<String> getRelease();

    @Input
    @Optional
    @Option(option = "repo", description = "The name of the repo to install")
    public abstract Property<String> getRepo();

    @Input
    @Optional
    @Option(
            option = "set",
            description =
                    "set values on the command line (can specify multiple or separate values with commas: key1=val1,key2=val2)")
    public abstract SetProperty<String> getSet();

    @Input
    @Optional
    @Option(option = "values", description = "Specify values in a YAML file or a URL (can specify multiple)")
    public abstract SetProperty<String> getValues();

    @Input
    @Optional
    @Option(
            option = "skipIfExists",
            description = "Skip installation if the release is already installed, default false")
    public abstract Property<Boolean> getSkipIfExists();

    @TaskAction
    void installChart() {
        HelmClientBuilder helmClientBuilder = HelmClient.builder();
        if (getNamespace().isPresent()) {
            helmClientBuilder.defaultNamespace(getNamespace().get());
        }
        HelmClient helmClient = helmClientBuilder.build();

        InstallChartOptionsBuilder optionsBuilder = InstallChartOptionsBuilder.builder();
        if (getCreateNamespace().isPresent()) {
            optionsBuilder.createNamespace(getCreateNamespace().get());
        }
        if (getSet().isPresent()) {
            optionsBuilder.set(new ArrayList<>(getSet().get()));
        }
        if (getValues().isPresent()) {
            optionsBuilder.values(new ArrayList<>(getValues().get()));
        }

        try {
            final String release = getRelease().getOrNull();
            Objects.requireNonNull(release, "release must not be null");

            if (getSkipIfExists().getOrElse(false)) {
                List<ReleaseItem> releaseItems = helmClient.listReleases(false);
                ReleaseItem releaseItem = releaseItems.stream()
                        .filter(item -> item.name().equals(release))
                        .findFirst()
                        .orElse(null);
                if (releaseItem != null) {
                    this.getProject()
                            .getLogger()
                            .warn(
                                    "HelmInstallChartTask.installChart() The release {} already exists, skipping install",
                                    release);
                    return;
                }
            }

            helmClient.installChart(
                    release, new Chart(getChart().getOrNull(), getRepo().getOrNull()), optionsBuilder.build());
        } catch (Exception e) {
            this.getProject()
                    .getLogger()
                    .error("HelmInstallChartTask.installChart() An ERROR occurred while installing the chart: ", e);
            throw e;
        }
    }
}
