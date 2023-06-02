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

plugins { id("com.gradle.enterprise").version("3.13.2") }

rootProject.name = "full-stack-testing"

includeBuild(".") // https://github.com/gradlex-org/java-module-dependencies/issues/26

// Include the subprojects
include(":fullstack-bom")

include(":fullstack-base-api")

include(":fullstack-helm-client")

include(":fullstack-junit-support")

include(":fullstack-reporting-api")

include(":fullstack-reporting-core")

include(":fullstack-validator-api")

include(":fullstack-validator-core")

gradleEnterprise {
    buildScan {
        termsOfServiceUrl = "https://gradle.com/terms-of-service"
        termsOfServiceAgree = "yes"

        if (!System.getenv("CI").isNullOrEmpty()) {
            publishAlways()
            tag("CI")
        }
    }
}
