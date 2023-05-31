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
    id("java")
    id("org.gradlex.java-ecosystem-capabilities")
    id("org.gradlex.extra-java-module-info")
    id("org.gradlex.java-module-dependencies")
}

javaModuleDependencies {
    versionsFromConsistentResolution(":fullstack-helm-client")
}

extraJavaModuleInfo {
    knownModule("org.slf4j:slf4j-api", "org.slf4j")
    knownModule("org.slf4j:slf4j-nop", "org.slf4j.nop")
    knownModule("org.slf4j:slf4j-simple", "org.slf4j.simple")
    knownModule("org.assertj:assertj-core", "org.assertj.core")

    module("com.vdurmont:semver4j", "com.vdurmont.semver4j") {
        exportAllPackages()
        requireAllDefinedDependencies()
    }
}
