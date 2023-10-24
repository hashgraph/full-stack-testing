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

package com.hedera.fullstack.base.api.threading;

import java.util.Objects;

/**
 * A builder for creating a {@link Thread}. By default, the created threads will be daemon threads unless overridden by
 * the {@link #daemon(boolean)} method.
 */
public final class ThreadBuilder {

    /**
     * The {@link Runnable} which should be executed by the thread.
     */
    private Runnable executable;

    /**
     * Whether the thread should be a daemon thread.
     */
    private boolean daemon;

    /**
     * The name of the thread.
     */
    private String name;

    /**
     * The priority of the thread.
     */
    private int priority;

    /**
     * The handler which should be invoked when the thread abruptly terminates due to an uncaught exception.
     */
    private Thread.UncaughtExceptionHandler exceptionHandler;

    /**
     * Creates a new {@link ThreadBuilder} instance.
     */
    public ThreadBuilder() {
        this.daemon = true;
        this.priority = Thread.NORM_PRIORITY;
    }

    /**
     * Creates a new {@link ThreadBuilder} instance with the specified thread executable.
     *
     * @param executable the {@link Runnable} which should be executed by the thread.
     * @throws NullPointerException if {@code executable} is {@code null}.
     */
    public ThreadBuilder(final Runnable executable) {
        this();
        executable(executable);
    }

    /**
     * Sets the {@link Runnable} which should be executed by the thread.
     *
     * @param executable the {@link Runnable} which should be executed by the thread.
     * @return this {@link ThreadBuilder} instance.
     * @throws NullPointerException if {@code executable} is {@code null}.
     */
    public ThreadBuilder executable(final Runnable executable) {
        this.executable = Objects.requireNonNull(executable, "executable must not be null");
        return this;
    }

    /**
     * Sets whether the thread should be a daemon thread.
     *
     * @param daemon whether the thread should be a daemon thread.
     * @return this {@link ThreadBuilder} instance.
     */
    public ThreadBuilder daemon(final boolean daemon) {
        this.daemon = daemon;
        return this;
    }

    /**
     * Sets the name of the thread.
     *
     * @param name the name of the thread.
     * @return this {@link ThreadBuilder} instance.
     */
    public ThreadBuilder name(final String name) {
        this.name = Objects.requireNonNull(name, "name must not be null");
        return this;
    }

    /**
     * Sets the priority of the thread. The priority must be between {@link Thread#MIN_PRIORITY} and
     * {@link Thread#MAX_PRIORITY}.
     *
     * @param priority the priority of the thread.
     * @return this {@link ThreadBuilder} instance.
     * @throws IllegalArgumentException if {@code priority} is not between {@link Thread#MIN_PRIORITY} and
     *                                  {@link Thread#MAX_PRIORITY}.
     */
    public ThreadBuilder priority(final int priority) {
        if (priority < Thread.MIN_PRIORITY || priority > Thread.MAX_PRIORITY) {
            throw new IllegalArgumentException(
                    "priority must be between " + Thread.MIN_PRIORITY + " and " + Thread.MAX_PRIORITY);
        }

        this.priority = priority;
        return this;
    }

    /**
     * Sets the handler which should be invoked when the thread abruptly terminates due to an uncaught exception.
     *
     * @param exceptionHandler the method to invoke when the thread abruptly terminates due to an uncaught exception.
     * @return this {@link ThreadBuilder} instance.
     * @throws NullPointerException if {@code exceptionHandler} is {@code null}.
     */
    public ThreadBuilder exceptionHandler(final Thread.UncaughtExceptionHandler exceptionHandler) {
        this.exceptionHandler = Objects.requireNonNull(exceptionHandler, "exceptionHandler must not be null");
        return this;
    }

    /**
     * Builds a new {@link Thread} instance.
     *
     * @return a new {@link Thread} instance.
     * @throws NullPointerException if {@code executable} is {@code null}.
     */
    public Thread build() {
        Objects.requireNonNull(executable, "executable must not be null");

        final Thread thread = new Thread(executable);
        thread.setDaemon(daemon);
        thread.setPriority(priority);

        if (name != null) {
            thread.setName(name);
        }

        if (exceptionHandler != null) {
            thread.setUncaughtExceptionHandler(exceptionHandler);
        }

        return thread;
    }
}
