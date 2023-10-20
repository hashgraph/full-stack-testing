package com.hedera.fullstack.gradle.plugin.kind.release

import net.swiftzer.semver.SemVer
import org.gradle.api.DefaultTask
import org.gradle.api.GradleException
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.logging.LogLevel
import org.gradle.api.plugins.JavaPluginExtension
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.get
import java.net.URL
import java.nio.file.Files
import java.nio.file.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.exists

@CacheableTask
abstract class KindArtifactTask() : DefaultTask() {
    @get:Input
    val version: Property<String> = project.objects.property(String::class.java).convention("0.20.0")

    @get:Input
    val tuples: ListProperty<ArtifactTuple> = project.objects.listProperty(ArtifactTuple::class.java).convention(
        ArtifactTuple.standardTuples()
    )

    @get:OutputDirectory
    val output: DirectoryProperty = project.objects.directoryProperty()

    private var actualVersion: SemVer? = null
    private var actualTuples: List<ArtifactTuple>? = null
    private var workingDirectory: Path? = null

    companion object {
        const val KIND_RELEASE_URL_TEMPLATE = "https://kind.sigs.k8s.io/dl/v%s/kind-%s-%s"
        const val KIND_EXECUTABLE_PREFIX = "kind"
        const val KIND_VERSION_FILE = "KIND_VERSION"
    }

    init {
        group = "kind"
        description = "Downloads the kind executable for the supplied operating systems and architectures"
        project.configure<JavaPluginExtension> {
            output.set(sourceSets["main"].resources.srcDirs.first().toPath().resolve("software").toFile())
        }
    }

    @TaskAction
    fun execute() {
        validate()
        createWorkingDirectory()

        for (tuple in actualTuples!!) {
            download(tuple)
        }

        project.logger.log(LogLevel.WARN, "Kind download output directory ${output.get().asFile.toPath()}")

        writeVersionFile(output.get().asFile.toPath())
    }

    private fun validate() {
        try {
            actualVersion = SemVer.parse(version.get())
        } catch (e: IllegalArgumentException) {
            throw StopExecutionException("The supplied version is not valid: ${version.get()}")
        }

        if (!tuples.isPresent) {
            throw StopExecutionException("No tuples were supplied")
        }

        if (tuples.get().isEmpty()) {
            throw StopExecutionException("No tuples were supplied")
        }

        actualTuples = tuples.get()

        if (!output.get().asFile.exists()) {
            try {
                output.get().asFile.mkdirs()
            } catch (e: Exception) {
                throw GradleException("Unable to create base artifact directory")
            }
        }
    }

    private fun createWorkingDirectory() {
        try {
            workingDirectory = Files.createTempDirectory("kind-artifacts")
            workingDirectory!!.toFile().deleteOnExit()
        } catch (e: Exception) {
            throw StopExecutionException("Unable to create working directory")
        }
    }

    private fun download(tuple: ArtifactTuple) {
        val downloadUrl = String.format(
            KIND_RELEASE_URL_TEMPLATE,
            actualVersion!!.toString(),
            tuple.operatingSystem.descriptor,
            tuple.architecture.descriptor
        )

        val tempFile = workingDirectory!!.resolve(KIND_EXECUTABLE_PREFIX + tuple.operatingSystem.fileExtension)

        try {
            val url = URL(downloadUrl)
            url.openStream().use { input ->
                Files.newOutputStream(tempFile).use { output ->
                    input.copyTo(output)
                    output.flush()
                }
            }
        } catch (e: Exception) {
            throw GradleException("Unable to download artifact from: $downloadUrl to: $tempFile")
        }

        val destination =
            output.get().asFile.toPath().resolve(tuple.operatingSystem.descriptor)
                .resolve(tuple.architecture.descriptor)
        copyFile(tempFile, destination)
    }

    private fun copyFile(source: Path, destination: Path) {
        if (!destination.exists()) {
            try {
                destination.createDirectories()
            } catch (e: Exception) {
                throw GradleException("Unable to create destination directory")
            }
        }

        try {
            project.logger.log(LogLevel.DEBUG, "Copying ${source} to ${destination}")
            project.copy {
                from(source)
                into(destination)
                includeEmptyDirs = false
            }
        } catch (e: Exception) {
            throw GradleException("Unable to write '${source}' to '${destination}'")
        }
    }

    private fun writeVersionFile(path: Path) {
        val versionFile = path.resolve(KIND_VERSION_FILE)
        try {
            Files.writeString(versionFile, actualVersion!!.toString())
        } catch (e: Exception) {
            throw GradleException("Unable to write version file")
        }
    }
}
