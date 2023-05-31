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

package com.hedera.fullstack.helm.client.execution;

import com.hedera.fullstack.helm.client.HelmConfigurationException;
import java.io.IOException;
import java.nio.file.Path;
import java.util.*;

/**
 * A builder for creating a helm command execution.
 */
public final class HelmExecutionBuilder {

    /**
     * The path to the helm executable.
     */
    private final Path helmExecutable;

    /**
     * The list of subcommands to be used when execute the helm command.
     */
    private final List<String> subcommands;

    /**
     * The arguments to be passed to the helm command.
     */
    private final Map<String, String> arguments;

    /**
     * The flags to be passed to the helm command.
     */
    private final List<String> flags;

    /**
     * The positional arguments to be passed to the helm command.
     */
    private final List<String> positionals;

    /**
     * The environment variables to be set when executing the helm command.
     */
    private final Map<String, String> environmentVariables;

    /**
     * The working directory to be used when executing the helm command.
     */
    private Path workingDirectory;

    /**
     * Creates a new {@link HelmExecutionBuilder} instance.
     *
     * @param helmExecutable the path to the helm executable.
     */
    public HelmExecutionBuilder(final Path helmExecutable) {
        this.helmExecutable = Objects.requireNonNull(helmExecutable, "helmExecutable must not be null");
        this.subcommands = new ArrayList<>();
        this.arguments = new HashMap<>();
        this.positionals = new ArrayList<>();
        this.flags = new ArrayList<>();
        this.environmentVariables = new HashMap<>();
        this.workingDirectory = this.helmExecutable.getParent();
    }

    /**
     * Adds the list of subcommands to the helm execution.
     *
     * @param commands the list of subcommands to be added.
     * @return this builder.
     */
    public HelmExecutionBuilder subcommands(final String... commands) {
        Objects.requireNonNull(commands, "commands must not be null");
        this.subcommands.addAll(Arrays.asList(commands));
        return this;
    }

    /**
     * Adds an argument to the helm command.
     *
     * @param name  the name of the argument.
     * @param value the value of the argument.
     * @return this builder.
     * @throws NullPointerException if either {@code name} or {@code value} is {@code null}.
     */
    public HelmExecutionBuilder argument(final String name, final String value) {
        Objects.requireNonNull(name, "name must not be null");
        Objects.requireNonNull(value, "value must not be null");
        this.arguments.put(name, value);
        return this;
    }

    /**
     * Adds a positional argument to the helm command.
     *
     * @param value the value of the positional argument.
     * @return this builder.
     * @throws NullPointerException if {@code value} is {@code null}.
     */
    public HelmExecutionBuilder positional(final String value) {
        Objects.requireNonNull(value, "value must not be null");
        this.positionals.add(value);
        return this;
    }

    /**
     * Adds an environment variable to the helm command.
     *
     * @param name  the name of the environment variable.
     * @param value the value of the environment variable.
     * @return this builder.
     * @throws NullPointerException if either {@code name} or {@code value} is {@code null}.
     */
    public HelmExecutionBuilder environmentVariable(final String name, final String value) {
        Objects.requireNonNull(name, "name must not be null");
        Objects.requireNonNull(value, "value must not be null");
        this.environmentVariables.put(name, value);
        return this;
    }

    /**
     * Sets the working directory for the helm process.
     *
     * @param workingDirectory the working directory.
     * @return this builder.
     */
    public HelmExecutionBuilder workingDirectory(final Path workingDirectory) {
        this.workingDirectory = Objects.requireNonNull(workingDirectory, "workingDirectory must not be null");
        return this;
    }

    /**
     * Adds a flag to the helm command.
     *
     * @param flag the flag to be added.
     * @return this builder.
     * @throws NullPointerException if {@code flag} is {@code null}.
     */
    public HelmExecutionBuilder flag(final String flag) {
        Objects.requireNonNull(flag, "flag must not be null");
        this.flags.add(flag);
        return this;
    }

    /**
     * Builds a {@link HelmExecution} from the current state of this builder.
     *
     * @return a {@link HelmExecution} instance.
     * @throws HelmConfigurationException if the helm process cannot be started.
     */
    public HelmExecution build() {
        final ProcessBuilder pb = new ProcessBuilder(buildCommand());
        final Map<String, String> env = pb.environment();
        env.putAll(environmentVariables);

        pb.redirectError(ProcessBuilder.Redirect.PIPE);
        pb.redirectOutput(ProcessBuilder.Redirect.PIPE);
        pb.directory(workingDirectory.toFile());

        try {
            return new HelmExecution(pb.start());
        } catch (IOException e) {
            throw new HelmConfigurationException(e);
        }
    }

    /**
     * Builds the CLI arguments including the program to be executed.
     *
     * @return the CLI arguments.
     */
    private String[] buildCommand() {
        final List<String> command = new ArrayList<>();
        command.add(helmExecutable.toString());
        command.addAll(subcommands);
        command.addAll(flags);

        for (final Map.Entry<String, String> entry : arguments.entrySet()) {
            command.add(String.format("--%s", entry.getKey()));
            command.add(entry.getValue());
        }

        command.addAll(positionals);
        return command.toArray(new String[0]);
    }
}
