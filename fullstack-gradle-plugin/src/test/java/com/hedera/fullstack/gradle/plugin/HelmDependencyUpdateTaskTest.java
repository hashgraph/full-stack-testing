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

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.hedera.fullstack.helm.client.HelmConfigurationException;
import java.io.File;
import org.gradle.api.Project;
import org.gradle.testfixtures.ProjectBuilder;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class HelmDependencyUpdateTaskTest {
    private static final String CHART = "../charts/hedera-network";
    private static Project project;

    @BeforeAll
    static void beforeAll() {
        project = ProjectBuilder.builder().build();
    }

    @Test
    @DisplayName("Test Helm Dependency Update Task")
    void testDependencyUpdate() {
        HelmDependencyUpdateTask helmDependencyUpdateTask = project.getTasks()
                .create("helmDependencyUpdateTask", HelmDependencyUpdateTask.class, task -> {
                    task.getChartName().set(CHART);
                    task.getWorkingDirectory().set(new File(".").toPath().toString());
                });
        assertThat(helmDependencyUpdateTask.getChartName().get()).isEqualTo(CHART);
        helmDependencyUpdateTask.dependencyUpdate();
    }

    @Test
    @DisplayName("Test Helm Dependency Update Task with no chart name")
    void testDependencyUpdateWithNoChartName() {
        HelmDependencyUpdateTask helmDependencyUpdateTask = project.getTasks()
                .create("helmDependencyUpdateNoChartTask", HelmDependencyUpdateTask.class, task -> {});
        assertThat(helmDependencyUpdateTask.getChartName().getOrNull()).isNull();
        NullPointerException e = assertThrows(NullPointerException.class, helmDependencyUpdateTask::dependencyUpdate);
        assertThat(e.getMessage()).contains("chartName must be set");
    }

    @Test
    @DisplayName("Test Helm Dependency Update Task with no bad working directory")
    void testDependencyUpdateWithBadWorkingDirectory() {
        HelmDependencyUpdateTask helmDependencyUpdateTask = project.getTasks()
                .create("helmDependencyUpdateBadWorkingDirectoryTask", HelmDependencyUpdateTask.class, task -> {
                    task.getChartName().set(CHART);
                    task.getWorkingDirectory().set("xyz");
                });
        assertThat(helmDependencyUpdateTask.getChartName().get()).isEqualTo(CHART);
        HelmConfigurationException e =
                assertThrows(HelmConfigurationException.class, helmDependencyUpdateTask::dependencyUpdate);
        assertThat(e.getMessage()).contains("No such file or directory");
    }
}
