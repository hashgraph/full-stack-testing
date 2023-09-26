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

pluginManagement { includeBuild("build-logic") }

plugins {
    id("com.gradle.enterprise").version("3.14.1")
    id("com.hedera.fullstack.settings")
}

rootProject.name = "full-stack-testing"

includeBuild(".") // https://github.com/gradlex-org/java-module-dependencies/issues/26

include(":fullstack-bom")

// Include the subprojects
include(":fullstack-alerting-api")

include(":fullstack-alerting-core")

include(":fullstack-assertj-extensions")

include(":fullstack-base-api")

include(":fullstack-configuration-api")

include(":fullstack-configuration-core")

include(":fullstack-helm-client")

include(":fullstack-junit-support")

include(":fullstack-datasource-api")

include(":fullstack-datasource-core")

// TODO: re-enable once we have a way to run the *-examples without IntelliJ and Sonar issues
// includeBuild("fullstack-examples")

include(":fullstack-gradle-plugin")

include(":fullstack-infrastructure-api")

include(":fullstack-infrastructure-core")

include(":fullstack-monitoring-api")

include(":fullstack-monitoring-core")

include(":fullstack-readiness-api")

include(":fullstack-reporting-api")

include(":fullstack-reporting-core")

include(":fullstack-resource-generator-api")

include(":fullstack-resource-generator-core")

include(":fullstack-service-locator")

include(":fullstack-test-toolkit")

include(":fullstack-test-toolkit-core")

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
