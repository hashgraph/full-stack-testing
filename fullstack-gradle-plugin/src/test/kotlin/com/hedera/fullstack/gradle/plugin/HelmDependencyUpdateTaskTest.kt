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

package com.hedera.fullstack.gradle.plugin

import  org.assertj.core.api.Assertions.assertThat
import  org.junit.jupiter.api.Assertions.assertThrows

import com.hedera.fullstack.helm.client.HelmConfigurationException
import java.io.File
import org.gradle.api.Project
import org.gradle.kotlin.dsl.create
import org.gradle.testfixtures.ProjectBuilder
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

class HelmDependencyUpdateTaskTest {
    companion object {
        private const val CHART = "../charts/fullstack-deployment"
        private lateinit var project: Project

        @BeforeAll
        @JvmStatic
        internal fun beforeAll() {
            project = ProjectBuilder.builder().build()
        }
    }

    @Test
    @DisplayName("Test Helm Dependency Update Task")
    internal fun testDependencyUpdate() {
//        val helmDependencyUpdateTask = project.tasks.create(
//            "helmDependencyUpdateTask",
//            HelmDependencyUpdateTask::class
//        ).apply {
//            chartName.set(CHART)
//            workingDirectory.set(File(".").toPath().toString())
//        }
//        assertThat(helmDependencyUpdateTask.chartName.get()).isEqualTo(CHART)
//        helmDependencyUpdateTask.dependencyUpdate()
    }

    @Test
    @DisplayName("Test Helm Dependency Update Task with no chart name")
    internal fun testDependencyUpdateWithNoChartName() {
        val helmDependencyUpdateTask = project.tasks.create(
            "helmDependencyUpdateNoChartTask",
            HelmDependencyUpdateTask::class
        )
        assertThat(helmDependencyUpdateTask.chartName.getOrNull()).isNull()
        val e: NullPointerException =
            assertThrows(NullPointerException::class.java, helmDependencyUpdateTask::dependencyUpdate)
        assertThat(e.message).contains("chartName must be set")
    }

    @Test
    @DisplayName("Test Helm Dependency Update Task with no bad working directory")
    internal fun testDependencyUpdateWithBadWorkingDirectory() {
        val helmDependencyUpdateTask = project.tasks.create(
            "helmDependencyUpdateBadWorkingDirectoryTask",
            HelmDependencyUpdateTask::class
        ).apply {
            chartName.set(CHART)
            workingDirectory.set("xyz")
        }
        assertThat(helmDependencyUpdateTask.chartName.get()).isEqualTo(CHART)
        val e: HelmConfigurationException =
            assertThrows(HelmConfigurationException::class.java, helmDependencyUpdateTask::dependencyUpdate)
        assertThat(e.message).contains("No such file or directory")
    }
}
