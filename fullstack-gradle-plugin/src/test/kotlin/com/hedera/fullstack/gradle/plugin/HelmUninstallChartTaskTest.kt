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

import  org.junit.jupiter.api.Assertions.assertThrows

import com.hedera.fullstack.helm.client.HelmExecutionException
import org.gradle.api.Project
import org.gradle.kotlin.dsl.create
import org.gradle.testfixtures.ProjectBuilder
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

class HelmUninstallChartTaskTest {
    companion object {
        private lateinit var project: Project

        @BeforeAll
        @JvmStatic
        internal fun beforeAll() {
            project = ProjectBuilder.builder().build()
        }
    }

    @Test
    @DisplayName("test an error is thrown when the chart is not found")
    fun testErrorThrownWhenChartNotFound() {
        assertThrows(HelmExecutionException::class.java) {
            val helmUninstallChartTask =
                project.tasks.create(
                    "helmUninstallNonExistingChart",
                    HelmUninstallChartTask::class
                ).apply {
                    namespace.set("test-failure")
                    release.set("not-a-release")

                }
            helmUninstallChartTask.uninstallChart()
        }
    }

    @Test
    @DisplayName("test that an uninstall will pass without error if the ifExists flag is set")
    fun testUninstallIfExists() {
        val helmUninstallChartTask =
            project.tasks.create(
                "helmUninstallIfExists",
                HelmUninstallChartTask::class
            ).apply {
                namespace.set("test-failure")
                release.set("not-a-release")
                ifExists.set(true)
            }
        helmUninstallChartTask.uninstallChart()
    }
}
