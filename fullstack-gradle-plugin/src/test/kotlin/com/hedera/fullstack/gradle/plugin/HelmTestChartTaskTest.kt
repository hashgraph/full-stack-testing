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

import  org.assertj.core.api.AssertionsForClassTypes.assertThat
import  org.junit.jupiter.api.Assertions.assertThrows

import org.gradle.api.Project
import org.gradle.kotlin.dsl.create
import org.gradle.testfixtures.ProjectBuilder
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

class HelmTestChartTaskTest {
    companion object {
        private lateinit var project: Project

        @BeforeAll
        @JvmStatic
        internal fun beforeAll() {
            project = ProjectBuilder.builder().build()
        }
    }

    @Test
    @DisplayName("test an error is thrown when the release is not found")
    fun testErrorThrownWhenReleaseNotFound() {
        val e = assertThrows(NullPointerException::class.java) {
            val helmTestChartTask =
                project.tasks.create(
                    "helmTestChartTaskNonExistingRelease",
                    HelmTestChartTask::class
                )
            helmTestChartTask.testChart()
        }
        assertThat(e.message).isEqualTo("release name must be specified")
    }
}
