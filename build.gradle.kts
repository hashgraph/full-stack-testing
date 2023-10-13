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

import com.bmuschko.gradle.docker.tasks.image.DockerBuildImage

plugins {
    id("com.hedera.fullstack.root")
    id("com.bmuschko.docker-remote-api").version("9.3.4")
}

repositories {
    // mavenLocal() // uncomment to use local maven repository
    mavenCentral()
    gradlePluginPortal()
}

val appVersion = project.version.toString()

fun createDockerBuildTask(taskName: String, containerName: String) {
    tasks.register<DockerBuildImage>(taskName) {
        inputDir.set(file("docker/${containerName}"))
        images.add("ghcr.io/hashgraph/full-stack-testing/${containerName}:${appVersion}")
    }
}

createDockerBuildTask("buildKubectlBats", "kubectl-bats")

createDockerBuildTask("buildUbi8InitDind", "ubi8-init-dind")

createDockerBuildTask("buildUbi8InitJava17", "ubi8-init-java17")
