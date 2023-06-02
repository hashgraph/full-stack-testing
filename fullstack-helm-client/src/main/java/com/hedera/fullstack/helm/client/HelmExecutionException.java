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

package com.hedera.fullstack.helm.client;

/**
 * Exception thrown when the execution of the Helm executable fails.
 */
public class HelmExecutionException extends RuntimeException {

    /**
     * the default message to use when no message is provided
     */
    public static final String DEFAULT_MESSAGE = "Execution of the Helm command failed with exit code: %d";

    /**
     * the non-zero system exit code returned by the Helm executable or the operating system
     */
    private final int exitCode;

    /**
     * Constructs a new exception instance with the specified exit code and a default message.
     *
     * @param exitCode the exit code returned by the Helm executable or the operating system.
     */
    public HelmExecutionException(final int exitCode) {
        this(exitCode, String.format(DEFAULT_MESSAGE, exitCode));
    }

    /**
     * Constructs a new exception instance with the specified exit code and message.
     *
     * @param exitCode the exit code returned by the Helm executable or the operating system.
     * @param message  the detail message (which is saved for later retrieval by the getMessage() method).
     */
    public HelmExecutionException(final int exitCode, final String message) {
        super(message);
        this.exitCode = exitCode;
    }

    /**
     * Constructs a new exception instance with the specified exit code and cause using the default message.
     *
     * @param exitCode the exit code returned by the Helm executable or the operating system.
     * @param cause    the cause (which is saved for later retrieval by the getCause() method). (A null value is permitted, and indicates that the cause is nonexistent or unknown.)
     */
    public HelmExecutionException(final int exitCode, final Throwable cause) {
        this(exitCode, String.format(DEFAULT_MESSAGE, exitCode), cause);
    }

    /**
     * Constructs a new exception instance with the specified exit code, message and cause.
     *
     * @param exitCode the exit code returned by the Helm executable or the operating system.
     * @param message  the detail message (which is saved for later retrieval by the getMessage() method).
     * @param cause    the cause (which is saved for later retrieval by the getCause() method). (A null value is permitted, and indicates that the cause is nonexistent or unknown.)
     */
    public HelmExecutionException(final int exitCode, final String message, final Throwable cause) {
        super(message, cause);
        this.exitCode = exitCode;
    }

    /**
     * Returns the exit code returned by the Helm executable or the operating system.
     *
     * @return the exit code returned by the Helm executable or the operating system.
     */
    public int getExitCode() {
        return exitCode;
    }
}
