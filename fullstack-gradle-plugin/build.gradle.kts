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

plugins {
    `kotlin-dsl`
    id("java-gradle-plugin")
    id("com.gradle.plugin-publish") version "1.2.1"
    id("com.hedera.fullstack.root")
    id("com.hedera.fullstack.conventions")
    id("com.hedera.fullstack.maven-publish")
    kotlin("jvm") version "1.9.10"
}

dependencies {
    api(platform("com.hedera.fullstack:fullstack-bom"))
    implementation("com.hedera.fullstack:fullstack-helm-client")
    implementation(kotlin("stdlib-jdk8"))
    implementation("net.swiftzer.semver:semver:1.1.2")
    testImplementation("org.assertj:assertj-core:3.24.2")
    testImplementation(kotlin("test"))
}

gradlePlugin {
    plugins {
        create("fullstackPlugin") {
            id = "com.hedera.fullstack.fullstack-gradle-plugin"
            group = "com.hedera.fullstack"
            implementationClass = "com.hedera.fullstack.gradle.plugin.FullstackPlugin"
            displayName = "Fullstack Plugin"
            description =
                "The Fullstack Plugin provides tools for working with Fullstack infrastructure."
        }
    }
}

repositories { mavenCentral() }

kotlin { jvmToolchain(17) }

tasks.test { useJUnitPlatform() }
