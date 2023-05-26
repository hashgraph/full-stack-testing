package com.hedera.fullstack.gradle.helm.release

import java.io.Serializable

class ArtifactTuple(
    val operatingSystem: OperatingSystem,
    val architecture: Architecture,
) : Serializable {
    companion object {
        @JvmStatic
        fun standardTuples(): List<ArtifactTuple> {
            return listOf(
                ArtifactTuple(OperatingSystem.DARWIN, Architecture.AMD64),
                ArtifactTuple(OperatingSystem.DARWIN, Architecture.ARM64),
                ArtifactTuple(OperatingSystem.WINDOWS, Architecture.AMD64),
                ArtifactTuple(OperatingSystem.LINUX, Architecture.AMD64),
                ArtifactTuple(OperatingSystem.LINUX, Architecture.ARM64),
                ArtifactTuple(OperatingSystem.LINUX, Architecture.ARM),
            )
        }

        @JvmStatic
        fun of(operatingSystem: OperatingSystem, architecture: Architecture): ArtifactTuple {
            return ArtifactTuple(operatingSystem, architecture)
        }
    }

    override fun hashCode(): Int {
        var result = operatingSystem.hashCode()
        result = 31 * result + architecture.hashCode()
        return result
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ArtifactTuple) return false

        if (operatingSystem != other.operatingSystem) return false
        return architecture == other.architecture
    }

    override fun toString(): String {
        return "${operatingSystem.descriptor}-${architecture.descriptor}"
    }
}
