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

import com.hedera.fullstack.base.api.util.ExceptionUtils.suppressExceptions
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Assertions.assertThrows

import com.hedera.fullstack.helm.client.HelmClient
import com.hedera.fullstack.helm.client.HelmExecutionException
import com.hedera.fullstack.helm.client.model.Chart
import com.hedera.fullstack.helm.client.model.Repository
import java.io.File
import org.gradle.api.Project
import org.gradle.kotlin.dsl.create
import org.gradle.testfixtures.ProjectBuilder
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Disabled
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

class HelmInstallChartTaskTest {
    companion object {
        private val REPOSITORY = Repository("stable", "https://charts.helm.sh/stable")
        private val CHART = Chart("mysql", "stable")

        private const val RELEASE_NAME = "mysql-release"

        private lateinit var project: Project

        @BeforeAll
        @JvmStatic
        internal fun beforeAll() {
            project = ProjectBuilder.builder().build()
        }
    }

    @Test
    @Disabled("currently this requires manual intervention to run")
    // 1. 'make deploy-chart'
    // 2. run this test case, assuming it passes and installs fst
    // 3. 'make destroy-chart'
    @DisplayName("Helm Install Chart Task for Fullstack Deployment Chart")
    fun testHelmInstallChartTaskForFullstackDeploymentChart() {
        val helmClient = HelmClient.defaultClient()
        suppressExceptions { helmClient.uninstallChart("fst") }
        try {
            val fullstackDeploymentChart = File("../charts/fullstack-deployment")
            val fullstackDeploymentChartPath = fullstackDeploymentChart.getCanonicalPath()
            val valuesFile = File(fullstackDeploymentChartPath + File.separator + "values.yaml")
            val valuesFilePath = valuesFile.getCanonicalPath()
            val helmInstallChartTask = project.tasks.create(
                "helmInstallFstChart",
                HelmInstallChartTask::class
            ).apply {
                chart.set(fullstackDeploymentChartPath)
                release.set("fst")
                // set image for nmt-install
                set.add("defaults.root.image.repository=hashgraph/full-stack-testing/ubi8-init-dind")
                values.add(valuesFilePath)
            }

            assertThat(helmInstallChartTask.release.get()).isEqualTo("fst")
            helmInstallChartTask.installChart()
        } finally {
            // TODO: comment this out as workaround until we no longer need manual use of make command
            // suppressExceptions{ helmClient.uninstallChart("fst") }
        }
    }

    @Test
    @DisplayName("Simple Helm Install Chart Task")
    fun testHelmInstallChartTaskSimple() {
        val ns = "simple-test"
        val helmClient = HelmClient.builder().defaultNamespace(ns).build()
        suppressExceptions { helmClient.uninstallChart(RELEASE_NAME) }
        suppressExceptions { helmClient.removeRepository(REPOSITORY) }
        val repositories = helmClient.listRepositories()
        if (!repositories.contains(REPOSITORY)) {
            helmClient.addRepository(REPOSITORY)
        }
        try {
            val helmInstallChartTask = project.tasks.create(
                "helmInstallChart",
                HelmInstallChartTask::class
            ).apply {
                chart.set(CHART.name())
                createNamespace.set(true)
                namespace.set(ns)
                release.set(RELEASE_NAME)
                repo.set(CHART.repoName())
                skipIfExists.set(true)
            }
            assertThat(helmInstallChartTask.release.get()).isEqualTo(RELEASE_NAME)
            helmInstallChartTask.installChart()

            // call a second time to test skipIfExists
            helmInstallChartTask.installChart()

            val helmReleaseExistsTask = project.tasks.create(
                "helmReleaseExists",
                HelmReleaseExistsTask::class
            ).apply {
                namespace.set(ns)
                release.set(RELEASE_NAME)
            }
            helmReleaseExistsTask.releaseExists()
            val helmTestChartTask = project.tasks.create(
                "helmTestChartTask",
                HelmTestChartTask::class
            ).apply {
                namespace.set(ns)
                release.set(RELEASE_NAME)
                filter.set("test")
                testTimeout.set("15m")
            }
            helmTestChartTask.testChart()
            val helmUninstallChartTask =
                project.tasks.create(
                    "helmUninstallChart",
                    HelmUninstallChartTask::class
                ).apply {
                    namespace.set(ns)
                    release.set(RELEASE_NAME)
                    ifExists.set(true)
                }
            helmUninstallChartTask.uninstallChart()
        } finally {
            suppressExceptions { helmClient.removeRepository(REPOSITORY) }
        }
    }

    @Test
    @DisplayName("test an error is thrown when the chart is not found")
    fun testErrorThrownWhenChartNotFound() {
        assertThrows(HelmExecutionException::class.java) {
            val helmInstallChartTask =
                project.tasks.create(
                    "helmInstallNonExistingChartChart",
                    HelmInstallChartTask::class
                ).apply {
                    chart.set("not-a-chart")
                    createNamespace.set(true)
                    namespace.set("test-failure")
                    release.set("not-a-release")
                    repo.set("not-a-repo")
                }
            helmInstallChartTask.installChart()
        }
    }
}
