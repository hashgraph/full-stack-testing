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

package com.hedera.fullstack.base.api.resource;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class ResourceLoader<T> {

    /**
     * The class which is requesting the resources.
     */
    private final Class<T> requester;

    /**
     * The list of class loaders to use to resolve the resources in order.
     */
    private final List<ClassLoader> resolvers;

    /**
     * Constructs a new {@link ResourceLoader} for the specified class which is requesting the resources.
     *
     * @param requester the class which is requesting the resources.
     * @throws NullPointerException if the requester is {@code null}.
     */
    public ResourceLoader(final Class<T> requester) {
        Objects.requireNonNull(requester, "requester cannot be null");
        this.requester = requester;

        this.resolvers = new ArrayList<>();
        this.resolvers.add(this.requester.getClassLoader());
        this.resolvers.add(ClassLoader.getSystemClassLoader());
        this.resolvers.add(ClassLoader.getPlatformClassLoader());
    }

    /**
     * Locates the resource on the classpath at the given path and copies the file to a temporary directory.
     * Additionally, the file permissions are set to be world readable, writable, and executable.
     *
     * @param path the relative or absolute path to the resource to load.
     * @return the path to the resource in the temporary directory.
     * @throws IOException if the resource cannot be loaded or an I/O error occurs.
     */
    public Path load(final String path) throws IOException {
        Objects.requireNonNull(path, "path cannot be null");

        final InputStream resourceStream = acquireResourceStream(path);
        final String fileName = Path.of(path).getFileName().toString();
        final Path tempDirectory = createTempDirectory();
        final Path tempFile = tempDirectory.resolve(fileName);

        Files.copy(resourceStream, tempFile);
        if (isPosixCompliant()) {
            Files.setPosixFilePermissions(tempFile, PosixFilePermissions.fromString("rwxrwxrwx"));
        } else {
            final File f = tempFile.toFile();
            f.setExecutable(true, false);
            f.setReadable(true, false);
            f.setWritable(true, false);
        }

        return tempFile;
    }

    /**
     * Acquires the resource stream for the specified path.
     *
     * @param path the path to the resource to acquire.
     * @return an {@link InputStream} for the specified resource.
     * @throws IOException          if the resource cannot be acquired or an I/O error occurs.
     * @throws NullPointerException if the path is {@code null}.
     */
    private InputStream acquireResourceStream(final String path) throws IOException {
        Objects.requireNonNull(path, "path cannot be null");

        for (final ClassLoader resolver : resolvers) {
            final InputStream stream = resolver.getResourceAsStream(path);
            if (stream != null) {
                return stream;
            }
        }

        throw new IOException("Unable to acquire resource stream for path: " + path);
    }

    /**
     * Creates a temporary directory for the requester.
     *
     * @return the path to the temporary directory.
     * @throws IOException if the temporary directory cannot be created or an I/O error occurs.
     */
    @SuppressWarnings("ResultOfMethodCallIgnored")
    private Path createTempDirectory() throws IOException {
        final Path tempDirectory = Files.createTempDirectory(requester.getSimpleName());
        tempDirectory.toFile().mkdir();
        tempDirectory.toFile().deleteOnExit();
        return tempDirectory;
    }

    /**
     * Is the system we're running on Posix compliant?
     * @return True if posix compliant.
     */
    protected boolean isPosixCompliant() {
        try {
            return FileSystems.getDefault().supportedFileAttributeViews().contains("posix");
        } catch (FileSystemNotFoundException | ProviderNotFoundException | SecurityException e) {
            return false;
        }
    }
}
