package com.hedera.fullstack.gradle.helm.release

enum class Architecture(val descriptor: String) {
    AMD64("amd64"),
    ARM64("arm64"),
    ARM("arm"),
    PPC64LE("ppc64le"),
    S390X("s390x"),
    RISCV64("riscv64");
}
