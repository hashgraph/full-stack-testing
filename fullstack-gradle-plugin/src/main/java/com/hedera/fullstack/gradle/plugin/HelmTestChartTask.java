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
import com.hedera.fullstack.helm.client.model.test.TestChartOptionsBuilder;
import java.util.Objects;
import org.gradle.api.DefaultTask;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.Optional;
import org.gradle.api.tasks.TaskAction;
import org.gradle.api.tasks.options.Option;

public abstract class HelmTestChartTask extends DefaultTask {
    @Input
    @Optional
    @Option(option = "namespace", description = "The namespace to use when installing the chart")
    public abstract Property<String> getNamespace();

    @Input
    @Optional
    @Option(option = "filter", description = "The filter to use when choosing the chart to test")
    public abstract Property<String> getFilter();

    @Input
    @Optional
    @Option(option = "timeout", description = "The timeout to use when testing the chart")
    public abstract Property<String> getTestTimeout();

    @Input
    @Option(option = "release", description = "The name of the release to install")
    public abstract Property<String> getRelease();

    @TaskAction
    void testChart() {
        HelmClientBuilder helmClientBuilder = HelmClient.builder();
        if (getNamespace().isPresent()) {
            helmClientBuilder.defaultNamespace(getNamespace().get());
        }
        HelmClient helmClient = helmClientBuilder.build();
        TestChartOptionsBuilder optionsBuilder = TestChartOptionsBuilder.builder();
        if (getFilter().isPresent()) {
            optionsBuilder.filter(getFilter().get());
        }
        if (getTestTimeout().isPresent()) {
            optionsBuilder.timeout(getTestTimeout().get());
        }
        try {
            final String releaseName = getRelease().getOrNull();
            Objects.requireNonNull(releaseName, "release name must be specified");
            helmClient.testChart(releaseName, optionsBuilder.build());
        } catch (Exception e) {
            this.getProject()
                    .getLogger()
                    .error("HelmTestChartTask.testChart() An ERROR occurred while testing the chart: ", e);
            throw e;
        }
    }
}
