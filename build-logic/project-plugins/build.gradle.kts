
plugins {
    `kotlin-dsl`
}

repositories {
    gradlePluginPortal()
    mavenCentral()
}

dependencies {
    implementation("com.autonomousapps:dependency-analysis-gradle-plugin:1.20.0")
    implementation("org.gradlex:extra-java-module-info:1.4")
    implementation("org.gradlex:java-ecosystem-capabilities:1.1")
    implementation("org.gradlex:java-module-dependencies:1.4.1")

    implementation("com.diffplug.spotless:spotless-plugin-gradle:6.18.0")
    implementation("org.sonarsource.scanner.gradle:sonarqube-gradle-plugin:4.0.0.2929")
    implementation("com.adarshr:gradle-test-logger-plugin:3.2.0")
    implementation("net.swiftzer.semver:semver:1.1.2")
}
