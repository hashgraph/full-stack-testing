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

import com.hedera.fullstack.gradle.plugin.HelmDependencyUpdateTask
import com.hedera.fullstack.gradle.plugin.HelmInstallChartTask
import com.hedera.fullstack.gradle.plugin.HelmReleaseExistsTask
import com.hedera.fullstack.gradle.plugin.HelmTestChartTask
import com.hedera.fullstack.gradle.plugin.HelmUninstallChartTask
import com.hedera.fullstack.gradle.plugin.kind.release.KindArtifactTask

plugins {
    id("com.hedera.fullstack.root")
    id("com.hedera.fullstack.conventions")
    id("com.hedera.fullstack.jpms-modules")
    id("com.hedera.fullstack.fullstack-gradle-plugin")
}

dependencies {
    // Bill of Materials
    implementation(platform("com.hedera.fullstack:fullstack-bom"))
}

tasks.register<HelmInstallChartTask>("helmInstallFstChart") {
    createNamespace.set(true)
    namespace.set("fst-ns")
    release.set("fst")
    chart.set("../charts/fullstack-deployment")
}

tasks.register<HelmInstallChartTask>("helmInstallNginxChart") {
    createNamespace.set(true)
    namespace.set("nginx-ns")
    release.set("nginx-release")
    chart.set("oci://ghcr.io/nginxinc/charts/nginx-ingress")
}

tasks.register<HelmUninstallChartTask>("helmUninstallNginxChart") {
    namespace.set("nginx-ns")
    release.set("nginx-release")
}

tasks.register<HelmReleaseExistsTask>("helmNginxExists") {
    allNamespaces.set(true)
    namespace.set("nginx-ns")
    release.set("nginx-release")
}

tasks.register<HelmDependencyUpdateTask>("helmDependencyUpdate") {
    chartName.set("../charts/fullstack-deployment")
}

tasks.register<HelmTestChartTask>("helmTestNginxChart") {
    namespace.set("nginx-ns")
    release.set("nginx-release")
}

// This task will succeed because it only uninstalls if the release exists
tasks.register<HelmUninstallChartTask>("helmUninstallNotAChart") {
    release.set("not-a-release")
    ifExists.set(true)
}

val kindVersion = "0.20.0"

tasks.register<KindArtifactTask>("kindArtifact") { version.set(kindVersion) }

tasks.check {
    dependsOn("helmInstallNginxChart")
    dependsOn("helmNginxExists")
    dependsOn("helmTestNginxChart")
    dependsOn("helmUninstallNginxChart")
    dependsOn("helmDependencyUpdate")
    dependsOn("helmUninstallNotAChart")
}
