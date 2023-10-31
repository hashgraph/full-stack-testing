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
import com.hedera.fullstack.helm.client.model.release.ReleaseItem
import java.util.Objects
import org.gradle.api.DefaultTask
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.TaskAction
import org.gradle.api.tasks.options.Option

abstract class HelmReleaseExistsTask : DefaultTask() {
    @Input
    @Option(option = "release", description = "The release to verify exists")
    var release = project.objects.property(String::class.java)

    @Input
    @Optional
    @Option(option = "namespace", description = "The namespace to use when listing the releases")
    var namespace = project.objects.property(String::class.java)

    @Input
    @Optional
    @Option(option = "allNamespaces", description = "True if we should list releases in all namespaces")
    var allNamespaces = project.objects.property(Boolean::class.java)

    @TaskAction
    fun releaseExists() {
        val releaseItem: ReleaseItem?
        try {
            val release = release.getOrNull()
            Objects.requireNonNull(release, "release must not be null")

            val helmClientBuilder = HelmClient.builder()
            if (namespace.isPresent) {
                helmClientBuilder.defaultNamespace(namespace.get())
            }

            val helmClient = helmClientBuilder.build()
            val releaseItems =
                helmClient.listReleases(allNamespaces.getOrElse(false))
            releaseItem = try {
                releaseItems.first { item -> item.name().equals(release) }
            } catch (e: NoSuchElementException) {
                null
            }
        } catch (e: Exception) {
            logger.error(
                "HelmReleaseExistsTask.releaseExists() An ERROR occurred while listing the releases: "
                        + e.message,
                e
            )
            throw e
        }

        if (releaseItem == null) {
            val errorMessage = "HelmReleaseExistsTask.releaseExists(): Release " + release.get() + " does not exist"
            logger.error(errorMessage)
            throw RuntimeException(errorMessage)
        }
    }
}
