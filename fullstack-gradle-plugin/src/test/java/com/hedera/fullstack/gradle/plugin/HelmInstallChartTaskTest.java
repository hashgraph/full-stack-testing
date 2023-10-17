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

import static com.hedera.fullstack.base.api.util.ExceptionUtils.suppressExceptions;
import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.hedera.fullstack.helm.client.HelmClient;
import com.hedera.fullstack.helm.client.HelmExecutionException;
import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.model.Repository;
import java.io.File;
import java.io.IOException;
import java.util.List;
import org.gradle.api.Project;
import org.gradle.testfixtures.ProjectBuilder;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class HelmInstallChartTaskTest {
    private static final Repository REPOSITORY = new Repository("stable", "https://charts.helm.sh/stable");
    private static final Chart CHART = new Chart("mysql", "stable");

    private static final String RELEASE_NAME = "mysql-release";

    private static Project project;

    @BeforeAll
    static void beforeAll() {
        project = ProjectBuilder.builder().build();
    }

    @Test
    @Disabled("currently this requires manual intervention to run")
    // 1. 'make deploy-chart'
    // 2. run this test case, assuming it passes and installs fst
    // 3. 'make destroy-chart'
    @DisplayName("Helm Install Chart Task for Hedera Network Chart")
    void testHelmInstallChartTaskForHederaNetworkChart() throws IOException {
        HelmClient helmClient = HelmClient.defaultClient();
        suppressExceptions(() -> helmClient.uninstallChart("fst"));
        try {
            final File hederaNetworkChart = new File("../charts/hedera-network");
            final String hederaNetworkChartPath = hederaNetworkChart.getCanonicalPath();
            final File valuesFile = new File(hederaNetworkChartPath + File.separator + "values.yaml");
            final String valuesFilePath = valuesFile.getCanonicalPath();
            HelmInstallChartTask helmInstallChartTask = project.getTasks()
                    .create("helmInstallFstChart", HelmInstallChartTask.class, task -> {
                        task.getChart().set(hederaNetworkChartPath);
                        task.getRelease().set("fst");
                        // set image for nmt-install
                        task.getSet().add("defaults.root.image.repository=hashgraph/full-stack-testing/ubi8-init-dind");
                        task.getValues().add(valuesFilePath);
                    });
            assertThat(helmInstallChartTask.getRelease().get()).isEqualTo("fst");
            helmInstallChartTask.installChart();
        } finally {
            // TODO: comment this out as workaround until we no longer need manual use of make command
            // suppressExceptions(() -> helmClient.uninstallChart("fst"));
        }
    }

    @Test
    @DisplayName("Simple Helm Install Chart Task")
    void testHelmInstallChartTaskSimple() {
        final String namespace = "simple-test";
        HelmClient helmClient = HelmClient.builder().defaultNamespace(namespace).build();
        suppressExceptions(() -> helmClient.uninstallChart(RELEASE_NAME));
        suppressExceptions(() -> helmClient.removeRepository(REPOSITORY));
        final List<Repository> repositories = helmClient.listRepositories();
        if (!repositories.contains(REPOSITORY)) {
            helmClient.addRepository(REPOSITORY);
        }
        try {
            HelmInstallChartTask helmInstallChartTask = project.getTasks()
                    .create("helmInstallChart", HelmInstallChartTask.class, task -> {
                        task.getChart().set(CHART.name());
                        task.getCreateNamespace().set(true);
                        task.getNamespace().set(namespace);
                        task.getRelease().set(RELEASE_NAME);
                        task.getRepo().set(CHART.repoName());
                        task.getSkipIfExists().set(true);
                    });
            assertThat(helmInstallChartTask.getRelease().get()).isEqualTo(RELEASE_NAME);
            helmInstallChartTask.installChart();

            // call a second time to test skipIfExists
            helmInstallChartTask.installChart();

            HelmReleaseExistsTask helmReleaseExistsTask = project.getTasks()
                    .create("helmReleaseExists", HelmReleaseExistsTask.class, task -> {
                        task.getNamespace().set(namespace);
                        task.getRelease().set(RELEASE_NAME);
                    });
            helmReleaseExistsTask.releaseExists();
            HelmUninstallChartTask helmUninstallChartTask = project.getTasks()
                    .create("helmUninstallChart", HelmUninstallChartTask.class, task -> {
                        task.getNamespace().set(namespace);
                        task.getRelease().set(RELEASE_NAME);
                        task.getIfExists().set(true);
                    });
            helmUninstallChartTask.uninstallChart();
        } finally {
            suppressExceptions(() -> helmClient.removeRepository(REPOSITORY));
        }
    }

    @Test
    @DisplayName("test an error is thrown when the chart is not found")
    void testErrorThrownWhenChartNotFound() {
        assertThrows(HelmExecutionException.class, () -> {
            HelmInstallChartTask helmInstallChartTask = project.getTasks()
                    .create("helmInstallNonExistingChartChart", HelmInstallChartTask.class, task -> {
                        task.getChart().set("not-a-chart");
                        task.getCreateNamespace().set(true);
                        task.getNamespace().set("test-failure");
                        task.getRelease().set("not-a-release");
                        task.getRepo().set("not-a-repo");
                    });
            helmInstallChartTask.installChart();
        });
    }
}
