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
import com.hedera.fullstack.helm.client.model.release.ReleaseItem;
import java.util.List;
import java.util.Objects;
import org.gradle.api.DefaultTask;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.Optional;
import org.gradle.api.tasks.TaskAction;
import org.gradle.api.tasks.options.Option;

public abstract class HelmUninstallChartTask extends DefaultTask {
    @Input
    @Optional
    @Option(option = "namespace", description = "The namespace to use when uninstalling the chart")
    public abstract Property<String> getNamespace();

    @Input
    @Optional
    @Option(
            option = "ifExists",
            description = "True if we should only uninstall the chart if it exists, default is false")
    public abstract Property<Boolean> getIfExists();

    @Input
    @Option(option = "release", description = "The name of the release to uninstall")
    public abstract Property<String> getRelease();

    @TaskAction
    void uninstallChart() {
        HelmClientBuilder helmClientBuilder = HelmClient.builder();
        if (getNamespace().isPresent()) {
            helmClientBuilder.defaultNamespace(getNamespace().get());
        }
        HelmClient helmClient = helmClientBuilder.build();

        try {
            final String release = getRelease().getOrNull();
            Objects.requireNonNull(release, "release must not be null");

            if (getIfExists().getOrElse(false)) {
                List<ReleaseItem> releaseItems = helmClient.listReleases(false);
                ReleaseItem releaseItem = releaseItems.stream()
                        .filter(item -> item.name().equals(release))
                        .findFirst()
                        .orElse(null);
                if (releaseItem == null) {
                    this.getProject()
                            .getLogger()
                            .warn(
                                    "HelmUninstallChartTask.uninstallChart() The release {} does not exist, skipping uninstall",
                                    release);
                    return;
                }
            }
            helmClient.uninstallChart(release);
        } catch (Exception e) {
            this.getProject()
                    .getLogger()
                    .error(
                            "HelmUninstallChartTask.uninstallChart() An ERROR occurred while uninstalling the chart: ",
                            e);
            throw e;
        }
    }
}
