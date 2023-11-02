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
import com.hedera.fullstack.helm.client.model.test.TestChartOptionsBuilder
import java.util.Objects
import org.gradle.api.DefaultTask
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.TaskAction
import org.gradle.api.tasks.options.Option

abstract class HelmTestChartTask : DefaultTask() {
    @Input
    @Optional
    @Option(description = "The namespace to use when installing the chart")
    val namespace = project.objects.property(String::class.java)

    @Input
    @Optional
    @Option(description = "The filter to use when choosing the chart to test")
    val filter = project.objects.property(String::class.java)

    @Input
    @Optional
    @Option(description = "The timeout to use when testing the chart")
    val testTimeout = project.objects.property(String::class.java)

    @Input
    @Option(description = "The name of the release to install")
    val release = project.objects.property(String::class.java)

    @TaskAction
    fun testChart() {
        val helmClientBuilder = HelmClient.builder()
        if (namespace.isPresent) {
            helmClientBuilder.defaultNamespace(namespace.get())
        }

        val helmClient = helmClientBuilder.build()

        val optionsBuilder = TestChartOptionsBuilder.builder()
        if (filter.isPresent) {
            optionsBuilder.filter(filter.get())
        }
        if (testTimeout.isPresent) {
            optionsBuilder.timeout(testTimeout.get())
        }

        try {
            val releaseName = release.getOrNull()
            Objects.requireNonNull(releaseName, "release name must be specified")
            helmClient.testChart(releaseName, optionsBuilder.build())
        } catch (e: Exception) {
            logger.error("HelmTestChartTask.testChart() An ERROR occurred while testing the chart: ", e)
            throw e
        }
    }
}
