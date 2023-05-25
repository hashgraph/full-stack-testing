package com.hedera.fst.gradle.helm.release

enum class OperatingSystem(val descriptor: String, val archiveExtension: String) {
    DARWIN("darwin",  "tar.gz"),
    LINUX("linux", "tar.gz"),
    WINDOWS("windows", "zip");
}
