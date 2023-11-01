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

import com.hedera.fullstack.helm.client.HelmClient
import org.gradle.api.DefaultTask
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.TaskAction
import org.gradle.api.tasks.options.Option
import java.nio.file.Paths
import java.util.*

abstract class HelmDependencyUpdateTask : DefaultTask() {
    @Input
    @Option(description = "The name of the chart to run the dependency update against")
    val chartName = project.objects.property(String::class.java)


    @Input
    @Optional
    @Option(description = "The working directory to run the dependency update from")
    val workingDirectory: Property<String?> = project.objects.property(String::class.java)


    @TaskAction
    fun dependencyUpdate() {
        val helmClientBuilder = HelmClient.builder()

        try {
            val chartName = chartName.getOrNull()
            Objects.requireNonNull(chartName, "chartName must be set")
            val workingDir = workingDirectory.getOrNull()
            if (!workingDir.isNullOrEmpty() && workingDir.isNotBlank()) {
                val workingDirectoryPath = Paths.get(workingDir)
                helmClientBuilder.workingDirectory(workingDirectoryPath)
            }
            val helmClient = helmClientBuilder.build()
            helmClient.dependencyUpdate(chartName)
        } catch (e: Exception) {
            logger.error(
                "HelmDependencyUpdateTask.dependencyUpdate() An ERROR occurred while running the dependency update: ",
                e
            )
            throw e
        }
    }
}
