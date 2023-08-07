/*
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.hedera.fullstack.service.locator.api;

import java.io.IOException;
import java.lang.module.Configuration;
import java.lang.module.FindException;
import java.lang.module.ModuleFinder;
import java.lang.module.ResolutionException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.util.*;
import java.util.jar.Attributes;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.jar.Manifest;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Dynamically loads Java JAR files from the file system as either class path entries or modules.
 * <p>
 * Discovered JAR files containing either a {@code module-info.class} file or Automatic-Module-Name manifest entry will
 * be loaded as modules. Otherwise, the JAR file will be loaded as a class path entry.
 *
 * <p>
 * Modules will be loaded and all services will be bound.
 *
 * <p>
 * Loading classes and modules is a resource intensive operation which involves file system and reflective accesses.
 * Therefore, it is recommended that the {@link ArtifactLoader} class be used to load artifacts at application startup
 * and retained for the lifetime of the application.
 *
 * @see java.lang.module.Configuration#resolveAndBind(ModuleFinder, ModuleFinder, Collection)
 */
public final class ArtifactLoader {

    /**
     * The class logger, to be used for all log messages.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(ArtifactLoader.class);

    /**
     * The artifact file extension.
     */
    private static final String ARTIFACT_EXTENSION = "jar";

    /**
     * The name of the {@code Automatic-Module-Name} manifest entry.
     */
    private static final String AUTOMATIC_MODULE_NAME = "Automatic-Module-Name";

    /**
     * The name of the {@code module-info.class} file.
     */
    private static final String MODULE_DESCRIPTOR_FILE = "module-info.class";

    /**
     * The list of paths to scan for loadable artifacts.
     */
    private final List<Path> pathsToScan;

    /**
     * The list of paths to the modules loaded by the {@link ArtifactLoader}.
     */
    private final List<Path> modulePath;

    /**
     * The list of paths to the class path entries loaded by the {@link ArtifactLoader}.
     */
    private final List<Path> classPath;

    /**
     * The mutable class loader used to load classes and modules.
     */
    private final MutableClassLoader classLoader;

    /**
     * The module layer containing the discovered modules which have been resolved and bound.
     */
    private ModuleLayer moduleLayer;

    /**
     * Constructs a new instance of the {@link ArtifactLoader} class.
     *
     * @param paths  the paths to scan for loadable artifacts. Paths may be either directories or JAR files.
     * @param parent the parent class loader to use when loading classes and modules.
     */
    private ArtifactLoader(final List<Path> paths, final ClassLoader parent) {
        this.pathsToScan = Objects.requireNonNull(paths, "paths must not be null");
        this.classLoader =
                new MutableClassLoader(new URL[0], Objects.requireNonNull(parent, "parent must not be null"));
        this.modulePath = new LinkedList<>();
        this.classPath = new LinkedList<>();
    }

    /**
     * Scans the file or directories specified by the {@code paths} parameter for loadable artifacts and returns a new
     * instance of the {@link ArtifactLoader} class.
     *
     * @param paths the paths to scan for loadable artifacts. Paths may be either directories or JAR files.
     * @return a new instance of the {@link ArtifactLoader} class.
     * @throws NullPointerException     if {@code paths} is {@code null}.
     * @throws IllegalArgumentException if {@code paths} is empty.
     */
    public static synchronized ArtifactLoader from(final Path... paths) {
        return from(false, null, paths);
    }

    /**
     * Scans the file or directories specified by the {@code paths} parameter for loadable artifacts and returns a new
     * instance of the {@link ArtifactLoader} class.
     *
     * @param recursive whether to recursively scan the specified directory paths for loadable artifacts.
     * @param paths     the paths to scan for loadable artifacts. Paths may be either directories or JAR files.
     * @return a new instance of the {@link ArtifactLoader} class.
     * @throws NullPointerException     if {@code paths} is {@code null}.
     * @throws IllegalArgumentException if {@code paths} is empty.
     */
    public static synchronized ArtifactLoader from(final boolean recursive, final Path... paths) {
        return from(recursive, null, paths);
    }

    /**
     * Scans the file or directories specified by the {@code paths} parameter for loadable artifacts and returns a new
     * instance of the {@link ArtifactLoader} class.
     *
     * @param parent the parent {@link ArtifactLoader} to use when loading classes and modules. May be {@code null}.
     * @param paths  the paths to scan for loadable artifacts. Paths may be either directories or JAR files.
     * @return a new instance of the {@link ArtifactLoader} class.
     * @throws NullPointerException     if {@code paths} is {@code null}.
     * @throws IllegalArgumentException if {@code paths} is empty.
     */
    public static synchronized ArtifactLoader from(final ArtifactLoader parent, final Path... paths) {
        return from(false, parent, paths);
    }

    /**
     * Scans the file or directories specified by the {@code paths} parameter for loadable artifacts and returns a new
     * instance of the {@link ArtifactLoader} class.
     *
     * @param recursive whether to recursively scan the specified directory paths for loadable artifacts.
     * @param parent    the parent {@link ArtifactLoader} to use when loading classes and modules. May be {@code null}.
     * @param paths     the paths to scan for loadable artifacts. Paths may be either directories or JAR files.
     * @return a new instance of the {@link ArtifactLoader} class.
     * @throws NullPointerException     if {@code paths} is {@code null}.
     * @throws IllegalArgumentException if {@code paths} is empty.
     */
    public static synchronized ArtifactLoader from(
            final boolean recursive, final ArtifactLoader parent, final Path... paths) {
        Objects.requireNonNull(paths, "paths must not be null");

        if (paths.length == 0) {
            throw new IllegalArgumentException("paths must not be empty");
        }

        final List<Path> pathsToScan = List.of(paths);
        final ClassLoader pcl = parent != null ? parent.classLoader() : ClassLoader.getSystemClassLoader();
        final ModuleLayer parentLayer = parent != null ? parent.moduleLayer() : ModuleLayer.boot();
        final ArtifactLoader loader = new ArtifactLoader(pathsToScan, pcl);

        loader.identifyArtifacts(recursive);
        loader.loadClassPath();
        loader.loadModules(parentLayer != null ? parentLayer : ModuleLayer.boot());

        return loader;
    }

    /**
     * The class loader used for the class path entries.
     *
     * @return the class loader.
     */
    public ClassLoader classLoader() {
        return classLoader;
    }

    /**
     * The module layer containing the discovered modules which have been resolved and bound.
     *
     * @return the module layer.
     */
    public ModuleLayer moduleLayer() {
        return moduleLayer;
    }

    /**
     * The list of individual files identified for inclusion on the class path.
     *
     * @return a list of class path files.
     */
    public List<Path> classPath() {
        return Collections.unmodifiableList(classPath);
    }

    /**
     * The list of individual files identified for inclusion on the module path.
     *
     * @return a list of module path files.
     */
    public List<Path> modulePath() {
        return Collections.unmodifiableList(modulePath);
    }

    /**
     *
     */
    private void identifyArtifacts(final boolean recursive) {
        final PathMatcher matcher =
                FileSystems.getDefault().getPathMatcher(String.format("glob:*.%s", ARTIFACT_EXTENSION));
        final Queue<Path> traversalQueue = new LinkedList<>(pathsToScan);
        while (!traversalQueue.isEmpty()) {
            final Path current = traversalQueue.poll();

            if (Files.isRegularFile(current) && matcher.matches(current.getFileName())) {
                addArtifact(current);
            } else if (Files.isDirectory(current)) {
                try (final Stream<Path> stream = Files.walk(current, recursive ? Integer.MAX_VALUE : 1)) {
                    stream.filter(Files::isRegularFile)
                            .filter(v -> matcher.matches(v.getFileName()))
                            .map(Path::toAbsolutePath)
                            .forEach(this::addArtifact);
                } catch (final IOException e) {
                    LOGGER.atWarn()
                            .setCause(e)
                            .log("Failed to walk directory, skipping artifact identification [ path = '{}' ]", current);
                }
            } else {
                LOGGER.atWarn()
                        .log("Skipping artifact identification, file is not a JAR archive [ path = '{}' ]", current);
            }
        }
    }

    /**
     * Adds the specified artifact to the class path or module path.
     *
     * @param artifact the artifact to add to the class path or module path.
     * @throws NullPointerException if {@code artifact} is {@code null}.
     */
    private void addArtifact(final Path artifact) {
        Objects.requireNonNull(artifact, "artifact must not be null");
        try {
            if (isModule(artifact)) {
                modulePath.add(artifact);
            } else {
                classPath.add(artifact);
            }
        } catch (final IOException e) {
            LOGGER.atWarn()
                    .setCause(e)
                    .log(
                            "Failed to identify artifact, an I/O error occurred [ fileName = '{}', path = '{}' ]",
                            artifact.getFileName(),
                            artifact);
        }
    }

    /**
     * Introspects a JAR artifact to determine if it is a formal module or an automatic module.
     *
     * @param artifact the artifact to check.
     * @return {@code true} if the specified artifact is a module, otherwise {@code false}.
     * @throws IOException          if an I/O error occurs.
     * @throws NullPointerException if {@code artifact} is {@code null}.
     */
    private boolean isModule(final Path artifact) throws IOException {
        Objects.requireNonNull(artifact, "artifact must not be null");
        try (final JarFile jf = new JarFile(artifact.toAbsolutePath().toString())) {
            final JarEntry mdf = jf.getJarEntry(MODULE_DESCRIPTOR_FILE);
            final Manifest mf = jf.getManifest();

            if (mdf == null && mf == null) {
                return false;
            }

            final Attributes attrs = mf.getMainAttributes();
            return mdf != null || attrs.containsKey(AUTOMATIC_MODULE_NAME);
        }
    }

    /**
     * Loads the class path artifacts into the class loader.
     */
    private void loadClassPath() {
        classPath.stream()
                .map(Path::toUri)
                .map(uri -> {
                    try {
                        return uri.toURL();
                    } catch (final MalformedURLException e) {
                        LOGGER.atWarn()
                                .setCause(e)
                                .log(
                                        "Failed to convert path to URL, unable to load class path entry [ path = '{}' ]",
                                        uri.getPath());
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .forEach(classLoader::addURL);
    }

    /**
     * Loads the module path artifacts into the module layer.
     *
     * @param parentLayer the parent module layer.
     * @throws NullPointerException     if {@code parentLayer} is {@code null}.
     * @throws ArtifactLoadingException if an error occurs while loading the module path artifacts.
     */
    private void loadModules(final ModuleLayer parentLayer) {
        Objects.requireNonNull(parentLayer, "parentLayer must not be null");

        if (modulePath.isEmpty()) {
            LOGGER.atDebug().log("No module path entries found, skipping module layer creation");
            return;
        }

        final ModuleFinder finder = ModuleFinder.of(modulePath.toArray(new Path[0]));
        try {
            final Configuration cfg =
                    parentLayer.configuration().resolveAndBind(finder, ModuleFinder.of(), Collections.emptySet());
            moduleLayer = parentLayer.defineModulesWithOneLoader(cfg, classLoader);
        } catch (LayerInstantiationException | SecurityException e) {
            LOGGER.atError().setCause(e).log("Failed to instantiate module layer, unable to load module path entries");
            throw new ArtifactLoadingException(e);
        } catch (FindException | ResolutionException e) {
            LOGGER.atError().setCause(e).log("Failed to resolve modules, unable to load module path entries");
            throw new ArtifactLoadingException(e);
        }
    }
}
