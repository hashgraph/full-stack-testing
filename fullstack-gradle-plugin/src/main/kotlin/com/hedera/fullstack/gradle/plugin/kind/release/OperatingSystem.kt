package com.hedera.fullstack.gradle.plugin.kind.release

enum class OperatingSystem(val descriptor: String, val fileExtension: String) {
    DARWIN("darwin",  ""),
    LINUX("linux", ""),
    WINDOWS("windows", ".exe");
}
