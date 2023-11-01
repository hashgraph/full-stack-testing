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

package com.hedera.fullstack.gradle.plugin.kind.release

import org.gradle.kotlin.dsl.create
import java.util.*

import org.assertj.core.api.Assertions.assertThat

import java.nio.file.Path
import org.gradle.api.Project
import org.gradle.testfixtures.ProjectBuilder
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

internal class KindArtifactTaskTest {
    companion object {
        private val os = System.getProperty("os.name").lowercase(Locale.getDefault())
        private val bit = System.getProperty("os.arch").lowercase(Locale.getDefault())
        private lateinit var project: Project

        @BeforeAll
        @JvmStatic
        internal fun beforeAll() {
            project = ProjectBuilder.builder().build()
            project.plugins.apply("java")
        }

        internal fun isWindows(): Boolean {
            return (os.contains("win"))
        }

        private fun isMac(): Boolean {
            return (os.contains("mac"))
        }

        private fun isLinux(): Boolean {
            return (os.contains("linux"))
        }

        private fun isArm64(): Boolean {
            return (bit.contains("arm64") || bit.contains("aarch64"))
        }

        private fun isAmd64(): Boolean {
            return (bit.contains("amd64") || bit.contains("x86_64"))
        }

        internal fun getOs(): String {
            return if (isWindows()) {
                "windows"
            } else if (isMac()) {
                "darwin"
            } else if (isLinux()) {
                "linux"
            } else {
                "unknown"
            }
        }

        internal fun getArchitecture(): String {
            return if (isArm64()) {
                "arm64"
            } else if (isAmd64()) {
                "amd64"
            } else {
                "unknown"
            }
        }

    }

    @Test
    @DisplayName("Test kind artifact download")
    fun testKindArtifactDownload() {
        val kindArtifactTask = project.tasks.create(
            "kindArtifactDownloadTask",
            KindArtifactTask::class
        ).apply {
            version.set("0.20.0")
        }
        kindArtifactTask.execute()

        val directory = kindArtifactTask.output.get()
        val kindExecutable = Path.of(directory.asFile.absolutePath)
            .resolve(getOs())
            .resolve(getArchitecture())
            .resolve("kind" + if (isWindows()) ".exe" else "")
            .toFile()
        assertThat(kindExecutable).exists()
    }
}
