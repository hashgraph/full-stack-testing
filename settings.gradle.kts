/*
 * Copyright (C) 2023-2024 Hedera Hashgraph, LLC
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

plugins { id("com.hedera.fullstack.settings") }

rootProject.name = "full-stack-testing"

includeBuild(".") // https://github.com/gradlex-org/java-module-dependencies/issues/26

// Include the subprojects
include(":docker-kubectl-bats", "docker/kubectl-bats")

include(":docker-ubi8-init-dind", "docker/ubi8-init-dind")

include(":docker-ubi8-init-java17", "docker/ubi8-init-java17")

include(":docker-ubi8-init-java21", "docker/ubi8-init-java21")

include(":fullstack-bom", "fullstack-core/fullstack-bom")

include(":fullstack-alerting-api", "fullstack-core/fullstack-alerting-api")

include(":fullstack-alerting-core", "fullstack-core/fullstack-alerting-core")

include(":fullstack-assertj-extensions", "fullstack-core/fullstack-assertj-extensions")

include(":fullstack-base-api", "fullstack-core/fullstack-base-api")

include(":fullstack-configuration-api", "fullstack-core/fullstack-configuration-api")

include(":fullstack-configuration-core", "fullstack-core/fullstack-configuration-core")

include(":fullstack-helm-client", "fullstack-core/fullstack-helm-client")

include(":fullstack-junit-support", "fullstack-core/fullstack-junit-support")

include(":fullstack-datasource-api", "fullstack-core/fullstack-datasource-api")

include(":fullstack-datasource-core", "fullstack-core/fullstack-datasource-core")

include(":fullstack-infrastructure-api", "fullstack-core/fullstack-infrastructure-api")

include(":fullstack-infrastructure-core", "fullstack-core/fullstack-infrastructure-core")

include(":fullstack-monitoring-api", "fullstack-core/fullstack-monitoring-api")

include(":fullstack-monitoring-core", "fullstack-core/fullstack-monitoring-core")

include(":fullstack-readiness-api", "fullstack-core/fullstack-readiness-api")

include(":fullstack-reporting-api", "fullstack-core/fullstack-reporting-api")

include(":fullstack-reporting-core", "fullstack-core/fullstack-reporting-core")

include(":fullstack-resource-generator-api", "fullstack-core/fullstack-resource-generator-api")

include(":fullstack-resource-generator-core", "fullstack-core/fullstack-resource-generator-core")

include(":fullstack-service-locator", "fullstack-core/fullstack-service-locator")

include(":fullstack-test-toolkit", "fullstack-core/fullstack-test-toolkit")

include(":fullstack-test-toolkit-core", "fullstack-core/fullstack-test-toolkit-core")

include(":fullstack-validator-api", "fullstack-core/fullstack-validator-api")

include(":fullstack-validator-core", "fullstack-core/fullstack-validator-core")

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

fun include(name: String, path: String) {
    include(name)
    project(name).projectDir = File(rootDir, path)
}
