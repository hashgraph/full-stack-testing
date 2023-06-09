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

package com.hedera.fullstack.base.api.io;

import com.hedera.fullstack.base.api.threading.ThreadBuilder;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * A sink for data which is read from an input stream. The data is buffered in a ring buffer and proxied to the
 * destination input stream. This class is useful when the data from the source input stream needs to be read asynchronously
 * and the destination input stream is not yet available.
 */
public class BufferedStreamSink implements AutoCloseable {

    /**
     * The default capacity of the sink ring buffer.
     */
    public static final int BUFFER_SIZE = 16384;

    /**
     * The underlying stream from which data should be read.
     */
    private final InputStream source;

    /**
     * The sink to which data should be written prior to being proxied to the final input stream.
     */
    private final ByteArrayOutputStream sink;

    /**
     * The input stream which is connected to the sink.
     */
    private InputStream destination;

    /**
     * The thread which is responsible for reading data from the source input stream and writing it to the sink.
     */
    private final Thread thread;

    /**
     * A flag indicating whether or not the sink has been closed.
     */
    private final AtomicBoolean closed;

    /**
     * Creates a new {@link BufferedStreamSink} instance using the default {@link #BUFFER_SIZE} for the ring buffer.
     *
     * @param source the underlying stream from which data should be read. This stream will not be closed when the
     *               {@link BufferedStreamSink} is closed.
     * @throws NullPointerException if {@code source} is {@code null}.
     */
    public BufferedStreamSink(final InputStream source) {
        this(source, BUFFER_SIZE);
    }

    /**
     * Creates a new {@link BufferedStreamSink} instance with the specified ring buffer capacity.
     *
     * @param source     the underlying stream from which data should be read. This stream will not be closed when the
     *                   {@link BufferedStreamSink} is closed.
     * @param bufferSize the capacity of the ring buffer. This value must be greater than zero.
     * @throws IllegalArgumentException if {@code bufferSize} is less than or equal to zero.
     * @throws NullPointerException     if {@code source} is {@code null}.
     */
    public BufferedStreamSink(final InputStream source, final int bufferSize) {
        Objects.requireNonNull(source, "source must not be null");
        if (bufferSize <= 0) {
            throw new IllegalArgumentException("bufferSize must be greater than zero");
        }

        this.source = source;
        this.sink = new ByteArrayOutputStream(bufferSize);
        this.closed = new AtomicBoolean(false);

        this.thread = new ThreadBuilder(this::run).name("stream-sink-io-reader").build();
    }

    /**
     * Initializes the sink and begins reading data from the source input stream.
     *
     * @return this {@link BufferedStreamSink} instance.
     */
    public synchronized BufferedStreamSink begin() {
        if (thread.isAlive() || thread.getState() != Thread.State.NEW) {
            throw new IllegalStateException("thread is already running");
        }

        thread.start();
        return this;
    }

    /**
     * Stops reading data from the source input stream and makes the data available via the {@link #getDataStream()}
     * method. This method is a no-op if the sink has already been closed and simply returns the already allocated
     * input stream.
     *
     * @return the input stream containing the data which was read from the source input stream. This is the same stream
     * which is also available from the {@link  #getDataStream()} method.
     * @throws IOException if an error occurs while closing the sink.
     */
    public synchronized InputStream end() throws IOException {
        if (closed.get()) {
            return destination;
        }

        closed.compareAndSet(false, true);

        if (thread.isAlive()) {
            try {
                int attempts = 0;

                while (thread.isAlive() && attempts < 50) {
                    attempts++;
                    thread.join(100);

                    if (attempts <= 1) {
                        thread.interrupt();
                    }
                }

                if (thread.isAlive()) {
                    throw new IOException("failed to terminate the sink thread and close the sink");
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        destination = new ByteArrayInputStream(sink.toByteArray());
        sink.reset();
        sink.close();

        return destination;
    }

    /**
     * Closes the sink and makes the data available via the {@link #getDataStream()} method.
     *
     * @throws IOException if an error occurs while closing the sink.
     */
    @Override
    public synchronized void close() throws IOException {
        end();
    }

    /**
     * Returns the original source stream which was used to create the buffered stream sink.
     *
     * @return the original source stream.
     */
    public synchronized InputStream getSource() {
        return source;
    }

    /**
     * Returns the stream containing the data which was read from the source input stream.
     *
     * @return the data stream.
     * @throws IllegalStateException if the sink has not been closed via the {@link #end()} or {@link #close()} methods.
     */
    public synchronized InputStream getDataStream() {
        if (!closed.get()) {
            throw new IllegalStateException("sink has not been closed");
        }

        return destination;
    }

    /**
     * The thread which is responsible for reading data from the source input stream and writing it to the sink.
     */
    private void run() {
        try {
            final byte[] buffer = new byte[1024];
            int read;

            while ((read = source.read(buffer)) != -1) {
                sink.write(buffer, 0, read);
                sink.flush();
            }
        } catch (IOException ignored) {
            // ignored
        }
    }
}
