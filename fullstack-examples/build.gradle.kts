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
import com.hedera.fullstack.gradle.plugin.HelmInstallChartTask

plugins {
    id("java")
    id("com.hedera.fullstack.umbrella")
    id("com.hedera.fullstack.conventions")
    id("com.hedera.fullstack.jpms-modules")
    id("com.hedera.fullstack.fullstack-gradle-plugin")
}

dependencies {
    api(platform("com.hedera.fullstack:fullstack-bom"))
    implementation("com.hedera.fullstack:fullstack-readiness-api")
    implementation("com.hedera.fullstack:fullstack-monitoring-api")
    implementation("com.hedera.fullstack:fullstack-test-toolkit")
    implementation("com.hedera.fullstack:fullstack-validator-api")
}

tasks.register<HelmInstallChartTask>("helmInstallFstChart") {
    createNamespace.set(true)
    namespace.set("fst-ns")
    release.set("fst")
    chart.set("../charts/hedera-network")
}

tasks.register<HelmInstallChartTask>("helmInstallNginxChart") {
    createNamespace.set(true)
    namespace.set("nginx-ns")
    release.set("nginx-release")
    chart.set("oci://ghcr.io/nginxinc/charts/nginx-ingress")
}

// TODO: task register helmUninstallNginxChart

tasks.check {
    dependsOn("helmInstallNginxChart")
    // TODO: depends on helmUninstallNginxChart
}