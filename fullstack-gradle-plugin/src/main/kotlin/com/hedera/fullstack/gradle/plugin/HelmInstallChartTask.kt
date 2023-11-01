/*
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
import com.hedera.fullstack.helm.client.model.Chart
import com.hedera.fullstack.helm.client.model.install.InstallChartOptionsBuilder
import org.gradle.api.DefaultTask
import org.gradle.api.provider.Property
import org.gradle.api.provider.SetProperty
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.TaskAction
import org.gradle.api.tasks.options.Option
import java.util.*

abstract class HelmInstallChartTask : DefaultTask() {
    @Input
    @Option(description = "The name of the chart to install")
    val chart: Property<String> = project.objects.property(String::class.java)

    @Input
    @Optional
    @Option(description = "Create the release namespace if not present")
    val createNamespace: Property<Boolean> = project.objects.property(Boolean::class.java)

    @Input
    @Optional
    @Option(description = "The namespace to use when installing the chart")
    val namespace: Property<String> = project.objects.property(String::class.java)

    @Input
    @Option(description = "The name of the release to install")
    val release: Property<String> = project.objects.property(String::class.java)

    @Input
    @Optional
    @Option(description = "The name of the repo to install")
    val repo: Property<String> = project.objects.property(String::class.java)

    @Input
    @Optional
    @Option(
        description =
        "set values on the command line (can specify multiple or separate values with commas: key1=val1,key2=val2)"
    )
    val set: SetProperty<String> = project.objects.setProperty(String::class.java)

    @Input
    @Optional
    @Option(description = "Specify values in a YAML file or a URL (can specify multiple)")
    val values: SetProperty<String> = project.objects.setProperty(String::class.java)

    @Input
    @Optional
    @Option(
        description = "Skip installation if the release is already installed, default false"
    )
    val skipIfExists: Property<Boolean> = project.objects.property(Boolean::class.java)

    @TaskAction
    fun installChart() {
        val helmClientBuilder = HelmClient.builder()
        if (namespace.isPresent) {
            helmClientBuilder.defaultNamespace(namespace.get())
        }
        val helmClient = helmClientBuilder.build()

        val optionsBuilder = InstallChartOptionsBuilder.builder()
        if (createNamespace.isPresent) {
            optionsBuilder.createNamespace(createNamespace.get())
        }
        if (set.isPresent) {
            optionsBuilder.set(ArrayList(set.get()))
        }
        if (values.isPresent) {
            optionsBuilder.values(ArrayList(values.get()))
        }

        try {
            val release = release.getOrNull()
            Objects.requireNonNull(release, "release must not be null")

            if (skipIfExists.getOrElse(false)) {
                val releaseItems = helmClient.listReleases(false)
                try {
                    releaseItems.first { it.name().equals(release) }
                    logger.warn(
                        "HelmInstallChartTask.installChart() The release {} already exists, skipping install",
                        release
                    )
                    return
                } catch (e: NoSuchElementException) {
                    // continue
                }
            }

            helmClient.installChart(
                release, Chart(
                    chart.getOrNull(), repo.getOrNull()
                ), optionsBuilder.build()
            )
        } catch (e: Exception) {
            logger.error("HelmInstallChartTask.installChart() An ERROR occurred while installing the chart: ", e)
            throw e
        }
    }
}
