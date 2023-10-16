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

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.gradle.api.Project;
import org.gradle.testfixtures.ProjectBuilder;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class HelmTestChartTaskTest {
    private static Project project;

    @BeforeAll
    static void beforeAll() {
        project = ProjectBuilder.builder().build();
    }

    @Test
    @DisplayName("test an error is thrown when the release is not found")
    void testErrorThrownWhenReleaseNotFound() {
        NullPointerException e = assertThrows(NullPointerException.class, () -> {
            HelmTestChartTask helmTestChartTask = project.getTasks()
                    .create("helmTestChartTaskNonExistingRelease", HelmTestChartTask.class, task -> {});
            helmTestChartTask.testChart();
        });
        assertThat(e.getMessage()).isEqualTo("release name must be specified");
    }
}