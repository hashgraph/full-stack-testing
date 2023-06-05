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

import static com.hedera.fullstack.helm.client.HelmExecutionException.DEFAULT_MESSAGE;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hedera.fullstack.base.api.util.StreamUtils;
import com.hedera.fullstack.helm.client.HelmExecutionException;
import com.hedera.fullstack.helm.client.HelmParserException;
import java.io.InputStream;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Represents the execution of a helm command and is responsible for parsing the response.
 */
public final class HelmExecution {

    /**
     * The message for a timeout error.
     */
    private static final String MSG_TIMEOUT_ERROR = "Timed out waiting for the process to complete";

    /**
     * The message for a deserialization error.
     */
    private static final String MSG_DESERIALIZATION_ERROR =
            "Failed to deserialize the output into the specified class: %s";

    /**
     * The message for a list deserialization error.
     */
    private static final String MSG_LIST_DESERIALIZATION_ERROR =
            "Failed to deserialize the output into a list of the specified class: %s";

    /**
     * The global Jackson {@link ObjectMapper} instance used to deserialize all response objects.
     */
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    /**
     * The executing process.
     */
    private final Process process;

    static {
        OBJECT_MAPPER.findAndRegisterModules();
        OBJECT_MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public HelmExecution(final Process process) {
        this.process = Objects.requireNonNull(process, "process must not be null");
    }

    /**
     * Causes the current thread to wait, if necessary, until the process represented by this Process object has
     * terminated. This method returns immediately if the process has already terminated. If the process has not yet
     * terminated, the calling thread will be blocked until the process exits.
     *
     * @throws InterruptedException if the current thread is interrupted by another thread while it is waiting, then the
     *                              wait is ended and an InterruptedException is thrown.
     */
    public void waitFor() throws InterruptedException {
        process.waitFor();
    }

    /**
     * Causes the current thread to wait, if necessary, until the process represented by this Process object has
     * terminated, or the specified waiting time elapses. If the process has already terminated then this method returns
     * immediately with the value true. If the process has not terminated and the timeout value is less than, or equal
     * to, zero, then this method returns immediately with the value false. The default implementation of this method
     * polls the exitValue to check if the process has terminated. Concrete implementations of this class are strongly
     * encouraged to override this method with a more efficient implementation.
     *
     * @param timeout the maximum time to wait.
     * @throws InterruptedException if the current thread is interrupted while waiting.
     */
    public boolean waitFor(final Duration timeout) throws InterruptedException {
        return process.waitFor(timeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
    }

    /**
     * Returns the exit code of the subprocess.
     *
     * @return the exit value of the subprocess represented by this Process object. by convention, the value 0 indicates
     * normal termination.
     * @throws IllegalThreadStateException if the subprocess represented by this Process object has not yet terminated.
     */
    public int exitCode() {
        return process.exitValue();
    }

    /**
     * Returns the input stream connected to the normal output of the subprocess. The stream obtains data piped from the
     * standard output of the process represented by this Process object.
     *
     * @return the input stream connected to the normal output of the subprocess.
     */
    public InputStream standardOutput() {
        return process.getInputStream();
    }

    /**
     * Returns the input stream connected to the error output of the subprocess. The stream obtains data piped from the
     * error output of the process represented by this Process object.
     *
     * @return the input stream connected to the error output of the subprocess.
     */
    public InputStream standardError() {
        return process.getErrorStream();
    }

    /**
     * Deserializes the standard output of the process into the specified response class. This variant will wait
     * indefinitely for the process to complete.
     *
     * @param responseClass The class to deserialize the response into.
     * @param <T>           The type of the response.
     * @return The deserialized response.
     */
    public <T> T responseAs(final Class<T> responseClass) {
        return responseAs(responseClass, null);
    }

    /**
     * Deserializes the standard output of the process into the specified response class.
     *
     * @param responseClass The class to deserialize the response into.
     * @param timeout       The maximum time to wait for the process to complete. If null, the method will wait
     *                      indefinitely for the process to complete.
     * @param <T>           The type of the response.
     * @return The deserialized response.
     */
    public <T> T responseAs(final Class<T> responseClass, final Duration timeout) {
        Objects.requireNonNull(responseClass, "responseClass must not be null");

        try {
            if (timeout != null) {
                if (!waitFor(timeout)) {
                    throw new HelmParserException(MSG_TIMEOUT_ERROR);
                }
            } else {
                waitFor();
            }
        } catch (final InterruptedException ignored) {
            Thread.currentThread().interrupt();
            return null;
        }

        if (exitCode() != 0) {
            throw new HelmExecutionException(exitCode());
        }

        try {
            return OBJECT_MAPPER.readValue(standardOutput(), responseClass);
        } catch (final Exception e) {
            throw new HelmParserException(String.format(MSG_DESERIALIZATION_ERROR, responseClass.getName()), e);
        }
    }

    /**
     * Deserializes the standard output of the process into a {@link List} of the specified response class. This variant
     * will wait indefinitely for the process to complete.
     *
     * @param responseClass The class to deserialize the response into.
     * @param <T>           The type of the response.
     * @return a list of the deserialized objects.
     */
    public <T> List<T> responseAsList(final Class<T> responseClass) {
        return responseAsList(responseClass, null);
    }

    /**
     * Deserializes the standard output of the process into a {@link List} of the specified response class.
     *
     * @param responseClass The class to deserialize the response into.
     * @param timeout       The maximum time to wait for the process to complete. If null, the method will wait
     *                      indefinitely for the process to complete.
     * @param <T>           The type of the response.
     * @return a list of the deserialized objects.
     */
    public <T> List<T> responseAsList(final Class<T> responseClass, final Duration timeout) {
        Objects.requireNonNull(responseClass, "responseClass must not be null");

        try {
            if (timeout != null) {
                if (!waitFor(timeout)) {
                    throw new HelmParserException(MSG_TIMEOUT_ERROR);
                }
            } else {
                waitFor();
            }
        } catch (final InterruptedException ignored) {
            Thread.currentThread().interrupt();
            return Collections.emptyList();
        }

        if (exitCode() != 0) {
            throw new HelmExecutionException(exitCode());
        }

        try {
            return OBJECT_MAPPER
                    .readerFor(responseClass)
                    .<T>readValues(standardOutput())
                    .readAll();
        } catch (final Exception e) {
            throw new HelmParserException(String.format(MSG_LIST_DESERIALIZATION_ERROR, responseClass.getName()), e);
        }
    }

    /**
     * Invokes a process which does not return a response. This variant will wait indefinitely for the process to
     * complete.
     */
    public void call() {
        call(null);
    }

    /**
     * Invokes a process which does not return a response.
     *
     * @param timeout The maximum time to wait for the process to complete. If null, the method will wait indefinitely
     *                for the process to complete.
     */
    public void call(final Duration timeout) {
        try {
            if (timeout != null) {
                if (!waitFor(timeout)) {
                    throw new HelmParserException(MSG_TIMEOUT_ERROR);
                }
            } else {
                waitFor();
            }
        } catch (final InterruptedException ignored) {
            Thread.currentThread().interrupt();
            return;
        }

        if (exitCode() != 0) {
            throw new HelmExecutionException(
                    exitCode(),
                    String.format(DEFAULT_MESSAGE, exitCode()) + ":\n"
                            + StreamUtils.streamToString(process.getErrorStream()));
        }
    }
}
