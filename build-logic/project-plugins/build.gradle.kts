
plugins {
    `kotlin-dsl`
}

repositories {
    gradlePluginPortal()
    mavenCentral()
}

dependencies {
    implementation("com.autonomousapps:dependency-analysis-gradle-plugin:1.26.0")
    implementation("org.gradlex:extra-java-module-info:1.6")
    implementation("org.gradlex:java-ecosystem-capabilities:1.3.1")
    implementation("org.gradlex:java-module-dependencies:1.5")

    implementation("com.diffplug.spotless:spotless-plugin-gradle:6.22.0")
    implementation("org.sonarsource.scanner.gradle:sonarqube-gradle-plugin:4.4.1.3373")
    implementation("com.adarshr:gradle-test-logger-plugin:4.0.0")
    implementation("net.swiftzer.semver:semver:1.3.0")
}
