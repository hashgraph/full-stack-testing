package com.hedera.fullstack.gradle.helm.release

import net.swiftzer.semver.SemVer
import org.gradle.api.DefaultTask
import org.gradle.api.GradleException
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.FileTree
import org.gradle.api.plugins.JavaPluginExtension
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.get
import java.net.URL
import java.nio.file.Files
import java.nio.file.Path
import java.util.function.Function
import kotlin.io.path.createDirectories
import kotlin.io.path.exists

@CacheableTask
abstract class HelmArtifactTask() : DefaultTask() {
    @get:Input
    val version: Property<String> = project.objects.property(String::class.java).convention("3.12.3")

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
        const val HELM_RELEASE_BASE_URL = "https://get.helm.sh/"
        const val HELM_ARTIFACT_TEMPLATE = "helm-v%s-%s-%s.%s"
        const val HELM_EXECUTABLE_PREFIX = "helm"
        const val HELM_VERSION_FILE = "HELM_VERSION"
    }

    init {
        group = "helm"
        description = "Downloads the helm executable for the supplied operating systems and architectures"
        project.configure<JavaPluginExtension> {
            output.set(sourceSets["main"].resources.srcDirs.first().toPath().resolve("software").toFile())
        }
    }

    @TaskAction
    fun execute() {
        validate()
        createWorkingDirectory()

        for (tuple in actualTuples!!) {
            logger.info("HelmArtifactTask: Downloading helm executable for $tuple")
            download(tuple)
        }

        writeVersionFile(output.get().asFile.toPath())
        logger.info("HelmArtifactTask: Successfully downloaded helm executable for version ${actualVersion!!.toString()}")
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
            workingDirectory = Files.createTempDirectory("helm-artifacts")
            workingDirectory!!.toFile().deleteOnExit()
        } catch (e: Exception) {
            throw StopExecutionException("Unable to create working directory")
        }
    }

    private fun download(tuple: ArtifactTuple) {
        val artifactName = String.format(
            HELM_ARTIFACT_TEMPLATE,
            actualVersion!!.toString(),
            tuple.operatingSystem.descriptor,
            tuple.architecture.descriptor,
            tuple.operatingSystem.archiveExtension
        )

        val tempFile = workingDirectory!!.resolve(artifactName)

        try {
            val url = URL(HELM_RELEASE_BASE_URL + artifactName)
            url.openStream().use { input ->
                Files.newOutputStream(tempFile).use { output ->
                    input.copyTo(output)
                    output.flush()
                }
            }
        } catch (e: Exception) {
            throw GradleException("Unable to download artifact from: ${HELM_RELEASE_BASE_URL + artifactName}")
        }

        val destination =
            output.get().asFile.toPath().resolve(tuple.operatingSystem.descriptor)
                .resolve(tuple.architecture.descriptor)
        var treeFn = Function<Any, FileTree> { project.tarTree(project.resources.gzip(it)) }

        if (tuple.operatingSystem == OperatingSystem.WINDOWS) {
            treeFn = Function<Any, FileTree> { project.zipTree(it) }
        }

        extractFile(treeFn, tempFile, HELM_EXECUTABLE_PREFIX, destination)
    }

    private fun extractFile(treeFn: Function<Any, FileTree>, archive: Path, fileNamePrefix: String, destination: Path) {
        if (!destination.exists()) {
            try {
                destination.createDirectories()
            } catch (e: Exception) {
                throw GradleException("Unable to create destination directory")
            }
        }

        try {
            project.copy {
                from(treeFn.apply(archive).filter { it.isFile && it.name.startsWith(fileNamePrefix) })
                into(destination)
                includeEmptyDirs = false
            }
        } catch (e: Exception) {
            throw GradleException("Unable to extract '${fileNamePrefix}' from '${archive}' to '${destination}'")
        }
    }

    private fun writeVersionFile(path: Path) {
        val versionFile = path.resolve(HELM_VERSION_FILE)
        try {
            Files.writeString(versionFile, actualVersion!!.toString())
        } catch (e: Exception) {
            throw GradleException("Unable to write version file")
        }
    }
}
