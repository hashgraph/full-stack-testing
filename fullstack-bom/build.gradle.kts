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
    id("maven-publish")
    id("signing")
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
    api(platform("org.mockito:mockito-bom:5.3.1"))
}

dependencies.constraints {
    api("org.slf4j:slf4j-api:2.0.7")
    api("org.slf4j:slf4j-nop:2.0.7")
    api("org.slf4j:slf4j-simple:2.0.7")
    api("com.jcovalent.junit:jcovalent-junit-logging:0.1.2")

    for (p in rootProject.childProjects) {
        val isPublished = p.value.findProperty("mavenPublishingEnabled")?.toString()?.toBoolean() ?: false
        val excludedProjects = listOf(project.name, project(":fullstack-gradle-plugin").name)
        if (isPublished && !excludedProjects.contains(p.value.name)) {
            api(project(p.value.path))
        }
    }
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components.getByName("javaPlatform"))

            pom {
                packaging = "pom"
                name.set(project.name)
                description.set(provider(project::getDescription))
                url.set("https://www.hedera.com/")
                inceptionYear.set("2023")

                organization {
                    name.set("Hedera Hashgraph, LLC")
                    url.set("https://www.hedera.com")
                }

                licenses {
                    license {
                        name.set("Apache License, Version 2.0")
                        url.set("https://raw.githubusercontent.com/hashgraph/full-stack-testing/main/LICENSE")
                    }
                }

                developers {
                    developer {
                        name.set("Full Stack Testing Team")
                        email.set("hedera-eng-automation@swirldslabs.com")
                        organization.set("Hedera Hashgraph")
                        organizationUrl.set("https://www.hedera.com")
                    }
                }

                scm {
                    connection.set("scm:git:git://github.com/hashgraph/full-stack-testing.git")
                    developerConnection.set("scm:git:ssh://github.com:hashgraph/full-stack-testing.git")
                    url.set("https://github.com/hashgraph/full-stack-testing")
                }
            }
        }
    }
    repositories {
        maven {
            name = "sonatype"
            url = uri("https://oss.sonatype.org/service/local/staging/deploy/maven2/")
            credentials {
                username = System.getenv("OSSRH_USERNAME")
                password = System.getenv("OSSRH_PASSWORD")
            }
        }
        maven {
            name = "sonatypeSnapshot"
            url = uri("https://oss.sonatype.org/content/repositories/snapshots/")
            credentials {
                username = System.getenv("OSSRH_USERNAME")
                password = System.getenv("OSSRH_PASSWORD")
            }
        }
    }
}

signing {
    useGpgCmd()
    sign(publishing.publications.getByName("maven"))
}

tasks.withType<Sign>() {
    onlyIf {
        project.hasProperty("publishSigningEnabled")
                && (project.property("publishSigningEnabled") as String).toBoolean()
    }
}

tasks.register("releaseMavenCentral") {
    group = "release"
    dependsOn(tasks.named("publishMavenPublicationToSonatypeRepository"))
}

tasks.register("releaseMavenCentralSnapshot") {
    group = "release"
    dependsOn(tasks.named("publishMavenPublicationToSonatypeSnapshotRepository"))
}
