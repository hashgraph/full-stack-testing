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

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

plugins {
    id("com.gradle.enterprise")
    id("org.gradle.toolchains.foojay-resolver-convention")
}

val isCiServer = System.getenv().containsKey("CI")

// Enable Gradle Build Scan
gradleEnterprise {
    buildScan {
        termsOfServiceUrl = "https://gradle.com/terms-of-service"
        termsOfServiceAgree = "yes"

        if (isCiServer) {
            publishAlways()
            tag("CI")
        }
    }
}


val gradleCacheUsername: String? = System.getenv("GRADLE_CACHE_USERNAME")
val gradleCachePassword: String? = System.getenv("GRADLE_CACHE_PASSWORD")
val gradleCacheAuthorized =
    (gradleCacheUsername?.isNotEmpty() ?: false) && (gradleCachePassword?.isNotEmpty() ?: false)

buildCache {
    remote<HttpBuildCache> {
        url = uri("https://cache.gradle.hedera.svcs.eng.swirldslabs.io/cache/")
        isPush = isCiServer && gradleCacheAuthorized

        isUseExpectContinue = true
        isEnabled = !gradle.startParameter.isOffline

        if (isCiServer && gradleCacheAuthorized) {
            credentials {
                username = gradleCacheUsername
                password = gradleCachePassword
            }
        }
    }
}

// Allow projects inside a build to be addressed by dependency coordinates notation.
// https://docs.gradle.org/current/userguide/composite_builds.html#included_build_declaring_substitutions
// Some functionality of the 'java-module-dependencies' plugin relies on this.
includeBuild(".")
