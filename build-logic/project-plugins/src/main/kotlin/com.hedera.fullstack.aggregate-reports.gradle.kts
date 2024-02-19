import net.swiftzer.semver.SemVer
import java.io.BufferedOutputStream

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
    id("org.sonarqube")
}

sonarqube {
    properties {
        property("sonar.host.url", "https://sonarcloud.io")
        property("sonar.organization", "hashgraph")
        property("sonar.projectKey", "com.hedera:full-stack-testing")
        property("sonar.projectName", "Full Stack Testing Suite")
        property("sonar.projectVersion", project.version)
        property(
            "sonar.projectDescription",
            "Full Stack Testing Suite (formerly known as JRS) for Hedera Services"
        )
        property("sonar.links.homepage", "https://github.com/hashgraph/full-stack-testing")
        property("sonar.links.ci", "https://github.com/hashgraph/full-stack-testing/actions")
        property("sonar.links.issue", "https://github.com/hashgraph/full-stack-testing/issues")
        property("sonar.links.scm", "https://github.com/hashgraph/full-stack-testing.git")
        property("sonar.gradle.skipCompile", "true")
    }
}

tasks.register("githubVersionSummary") {
    group = "versioning"
    doLast {
        val ghStepSummaryPath: String = System.getenv("GITHUB_STEP_SUMMARY")
            ?: throw IllegalArgumentException("This task may only be run in a Github Actions CI environment! Unable to locate the GITHUB_STEP_SUMMARY environment variable.")

        val ghStepSummaryFile: File = File(ghStepSummaryPath)
        Utils.generateProjectVersionReport(rootProject, BufferedOutputStream(ghStepSummaryFile.outputStream()))
    }
}

tasks.register("versionAsSpecified") {
    group = "versioning"
    doLast {
        val verStr = findProperty("newVersion")?.toString()
            ?: throw IllegalArgumentException("No newVersion property provided! Please add the parameter -PnewVersion=<version> when running this task.")

        val newVer = SemVer.parse(verStr)
        Utils.updateHelmChartVersion(project, newVer)
        Utils.updateHelmChartAppVersion(project, newVer)
        Utils.updateVersion(project, newVer)
    }
}

tasks.register("versionAsSnapshot") {
    group = "versioning"
    doLast {
        val currVer = SemVer.parse(project.version.toString())
        val newVer = SemVer(currVer.major, currVer.minor, currVer.patch, "SNAPSHOT")

        Utils.updateHelmChartVersion(project, newVer)
        Utils.updateHelmChartAppVersion(project, newVer)
        Utils.updateVersion(project, newVer)
    }
}

tasks.register("showVersion") {
    group = "versioning"
    doLast {
        println(project.version)
    }
}
