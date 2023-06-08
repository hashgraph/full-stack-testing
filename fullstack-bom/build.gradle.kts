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
    id("java-platform")
}

repositories {
    mavenCentral()
}

javaPlatform {
    allowDependencies()
}

dependencies {
    // Define the external Bill of Material (BOM) required by this project
    api(platform("io.fabric8:kubernetes-client-bom:6.6.2"))
    api(platform("org.junit:junit-bom:5.9.3"))
    api(platform("org.assertj:assertj-bom:3.24.2"))
    api(platform("com.fasterxml.jackson:jackson-bom:2.15.2"))
    api(platform("org.mockito:mockito-bom:5.2.0"))
}

dependencies.constraints {
    api("org.slf4j:slf4j-api:2.0.7")
    api("org.slf4j:slf4j-nop:2.0.7")
    api("org.slf4j:slf4j-simple:2.0.7")
}
