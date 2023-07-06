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

    knownModule("com.fasterxml.jackson.core:jackson-core", "com.fasterxml.jackson.core")
    knownModule("com.fasterxml.jackson.core:jackson-databind", "com.fasterxml.jackson.databind")

    knownModule("com.jcovalent.junit:jcovalent-junit-logging","com.jcovalent.junit.logging")

    knownModule("net.bytebuddy:byte-buddy", "net.bytebuddy")
    knownModule("net.bytebuddy:byte-buddy-agent", "net.bytebuddy.agent")
    knownModule("org.objenesis:objenesis", "org.objenesis")

    knownModule("org.junit.jupiter:junit-jupiter-api", "org.junit.jupiter.api")

    knownModule("org.mockito:mockito-core", "org.mockito")
    knownModule("org.mockito:mockito-junit-jupiter", "org.mockito.junit.jupiter")

    automaticModule("org.mockito:mockito-inline", "org.mockito.inline")
}
