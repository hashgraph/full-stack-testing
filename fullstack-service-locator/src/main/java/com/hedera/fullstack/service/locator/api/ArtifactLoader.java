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

import java.lang.module.ModuleFinder;
import java.net.URL;
import java.nio.file.Path;
import java.util.*;

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
        this.classLoader = new MutableClassLoader(new URL[0], Objects.requireNonNull(parent, "parent must not be null"));
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
     * @param parent    the parent {@link ArtifactLoader} to use when loading classes and modules. May be {@code null}.
     * @param paths     the paths to scan for loadable artifacts. Paths may be either directories or JAR files.
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
    public static synchronized ArtifactLoader from(final boolean recursive, final ArtifactLoader parent, final Path... paths) {
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
        loader.loadModules(parentLayer);

        return loader;
    }

    public ClassLoader classLoader() {
        return classLoader;
    }

    public ModuleLayer moduleLayer() {
        return moduleLayer;
    }

    public List<Path> classPath() {
        return Collections.unmodifiableList(classPath);
    }

    public List<Path> modulePath() {
        return Collections.unmodifiableList(modulePath);
    }

    /**
     *
     */
    private void identifyArtifacts(final boolean recursive) {

    }

    /**
     *
     */
    private void loadClassPath() {

    }

    /**
     *
     * @param parentLayer
     */
    private void loadModules(final ModuleLayer parentLayer) {

    }
}
