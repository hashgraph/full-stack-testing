
plugins {
    id("com.hedera.fst.conventions")
}

dependencies {
    // API Libraries
    api(testLibs.bundles.junit.jupiter.api)

    // Test Libraries
    testRuntimeOnly(testLibs.bundles.junit.jupiter.engine)
}
