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

import com.hedera.fullstack.gradle.helm.release.HelmArtifactTask

plugins {
    id("com.hedera.fullstack.conventions")
    id("com.hedera.fullstack.jpms-modules")
    id("com.hedera.fullstack.maven-publish")
}

tasks.register<HelmArtifactTask>("helmArtifacts")

@Suppress("UnstableApiUsage")
tasks.withType<ProcessResources> { dependsOn(tasks.withType<HelmArtifactTask>()) }

dependencies {
    // Bill of Materials
    implementation(platform(project(":fullstack-bom")))
    javaModuleDependencies {
        testImplementation(gav("org.junit.jupiter.api"))
        testImplementation(gav("org.junit.jupiter.params"))
        testImplementation(gav("org.assertj.core"))
        testImplementation(gav("com.jcovalent.junit.logging"))
        testImplementation(gav("org.mockito"))
        testImplementation(gav("org.mockito.junit.jupiter"))
    }
}

tasks.named("sourcesJar") { dependsOn(tasks.withType<HelmArtifactTask>()) }
