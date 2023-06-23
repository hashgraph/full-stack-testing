/*
 * Copyright 2016-2023 Hedera Hashgraph, LLC
 *
 * This software is the confidential and proprietary information of
 * Hedera Hashgraph, LLC. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Hedera Hashgraph.
 *
 * HEDERA HASHGRAPH MAKES NO REPRESENTATIONS OR WARRANTIES ABOUT THE SUITABILITY OF
 * THE SOFTWARE, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE, OR NON-INFRINGEMENT. HEDERA HASHGRAPH SHALL NOT BE LIABLE FOR
 * ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING OR
 * DISTRIBUTING THIS SOFTWARE OR ITS DERIVATIVES.
 */

plugins {
    id("java")
    id("maven-publish")
    id("signing")
}

beforeEvaluate{
    project.setProperty("mavenPublishingEnabled", true)
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components.getByName("java"))

            pom {
                packaging = findProperty("maven.project.packaging")?.toString() ?: "jar"
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

java {
    withJavadocJar()
    withSourcesJar()
}
