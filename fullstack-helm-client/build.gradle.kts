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

plugins { id("com.hedera.fullstack.conventions") }

tasks.register<HelmArtifactTask>("helmArtifacts")

@Suppress("UnstableApiUsage")
tasks.withType<ProcessResources> { dependsOn(tasks.withType<HelmArtifactTask>()) }

dependencies {
    // Bill of Materials
    implementation(enforcedPlatform(project(":fullstack-bom")))
    javaModuleDependencies {
        testImplementation(gav("org.junit.jupiter.api"))
        testImplementation(gav("org.assertj.core"))
        testImplementation(gav("org.mockito"))
        testImplementation(gav("org.mockito.junit.jupiter"))
        testRuntimeOnly(gav("org.mockito.inline"))
    }
}
