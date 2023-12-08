import com.adarshr.gradle.testlogger.theme.ThemeType
import net.swiftzer.semver.SemVer

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
    id("java-library")
    id("jacoco")

   // Conventions Plugins
    id("com.hedera.fullstack.spotless-conventions")
    id("com.hedera.fullstack.spotless-java-conventions")
    id("com.hedera.fullstack.spotless-kotlin-conventions")

    // Third Party Plugins
    id("com.adarshr.test-logger")
}

repositories {
    // Source Maven Central Artifacts from JFrog Artifactory
    maven { url = uri("https://artifacts.swirldslabs.io/artifactory/central-maven-external/") }
}

// Configure the JVM build environment
java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21

    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
        vendor.set(JvmVendorSpec.ADOPTIUM)
    }
}

// Make sure we use UTF-8 encoding when compiling
tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
}

tasks.withType<Javadoc>().configureEach {
    options.encoding = "UTF-8"

    // Configure Javadoc Tag Support
    (options as StandardJavadocDocletOptions)
        .tags("apiNote:a:API Note:", "implSpec:a:Implementation Requirements:", "implNote:a:Implementation Note:")
}

// Ensure that all JAR files are reproducible
tasks.withType<Jar>().configureEach {
    isReproducibleFileOrder = true
    isPreserveFileTimestamps = false
    fileMode = 664
    dirMode = 775
}

// Setup Unit Tests
testing {
    suites {
        // Configure the normal unit test suite to use JUnit Jupiter.
        @Suppress("UnstableApiUsage")
        named("test", JvmTestSuite::class) {
            // Enable JUnit Jupiter as our test engine
            useJUnitJupiter()
            targets.all {
                testTask {
                    // Increase the heap size for the unit tests
                    maxHeapSize = "4g"
                }
            }
        }
    }
}

// Ensure JaCoCo coverage is generated and aggregated
tasks.jacocoTestReport.configure {
    reports {
        xml.required.set(true)
        html.required.set(true)
    }

    val testExtension = tasks.test.get().extensions.getByType<JacocoTaskExtension>()
    executionData.setFrom(testExtension.destinationFile)

    shouldRunAfter(tasks.named("check"))
}

// Ensure the check task also runs the JaCoCo coverage report
tasks.named("check").configure {
    dependsOn(tasks.named<JacocoReport>("jacocoTestReport"))
}

tasks.named("assemble").configure {
    dependsOn(tasks.named("testClasses"))
}

// Improve test logging
testlogger {
    theme = ThemeType.MOCHA
    slowThreshold = 10000
    showStandardStreams = true
    showPassedStandardStreams = false
    showSkippedStandardStreams = false
    showFailedStandardStreams = true
}
