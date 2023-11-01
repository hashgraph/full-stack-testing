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
import java.util.Objects
import org.gradle.api.DefaultTask
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.TaskAction
import org.gradle.api.tasks.options.Option

abstract class HelmUninstallChartTask : DefaultTask() {
    @Input
    @Optional
    @Option(option = "namespace", description = "The namespace to use when uninstalling the chart")
    var namespace = project.objects.property(String::class.java)

    @Input
    @Optional
    @Option(
        option = "ifExists",
        description = "True if we should only uninstall the chart if it exists, default is false"
    )
    var ifExists = project.objects.property(Boolean::class.java)

    @Input
    @Option(option = "release", description = "The name of the release to uninstall")
    var release = project.objects.property(String::class.java)

    @TaskAction
    fun uninstallChart() {
        val helmClientBuilder = HelmClient.builder()
        if (namespace.isPresent) {
            helmClientBuilder.defaultNamespace(namespace.get())
        }
        val helmClient = helmClientBuilder.build()

        try {
            val release = release.getOrNull()
            Objects.requireNonNull(release, "release must not be null")

            if (ifExists.getOrElse(false)) {
                val releaseItems = helmClient.listReleases(false)
                try {
                    releaseItems.first { item -> item.name().equals(release) }
                } catch (e: NoSuchElementException) {
                    logger.warn(
                        "HelmUninstallChartTask.uninstallChart() The release {} does not exist, skipping uninstall",
                        release
                    )
                    return
                }
            }
            helmClient.uninstallChart(release)
        } catch (e: Exception) {
            logger.error(
                "HelmUninstallChartTask.uninstallChart() An ERROR occurred while uninstalling the chart: ",
                e
            )
            throw e
        }
    }
}
