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

package com.hedera.fullstack.base.api.logging;

import com.jcovalent.junit.logging.LogEntry;
import java.time.Instant;
import org.slf4j.event.Level;

// TODO move to jcovalent

/**
 * A builder for {@link LogEntry} instances.
 */
public final class LogEntryBuilder {
    private long sequenceNumber;
    private Instant timestamp;
    private Level level;
    private String markerName;
    private String threadName;
    private String loggerName;
    private String message;
    private Throwable throwable;
    private String formattedLogLine;

    private LogEntryBuilder() {}

    /**
     * Creates a new {@link LogEntryBuilder} instance.
     * @return a new {@link LogEntryBuilder} instance.
     */
    public static LogEntryBuilder builder() {
        return new LogEntryBuilder();
    }

    /**
     * Sets the {@code sequenceNumber} and returns a reference to this Builder so that the methods can be chained together.
     * @param sequenceNumber the {@code sequenceNumber} to set
     * @return a reference to this Builder
     */
    public LogEntryBuilder sequenceNumber(long sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
        return this;
    }

    /**
     * Sets the {@code timestamp} and returns a reference to this Builder so that the methods can be chained together.
     * @param timestamp the {@code timestamp} to set
     * @return a reference to this Builder
     */
    public LogEntryBuilder timestamp(Instant timestamp) {
        this.timestamp = timestamp;
        return this;
    }

    /**
     * Sets the {@code level} and returns a reference to this Builder so that the methods can be chained together.
     * @param level the {@code level} to set
     * @return a reference to this Builder
     */
    public LogEntryBuilder level(Level level) {
        this.level = level;
        return this;
    }

    /**
     * Sets the {@code markerName} and returns a reference to this Builder so that the methods can be chained together.
     * @param markerName the {@code markerName} to set
     * @return a reference to this Builder
     */
    public LogEntryBuilder markerName(String markerName) {
        this.markerName = markerName;
        return this;
    }

    /**
     * Sets the {@code threadName} and returns a reference to this Builder so that the methods can be chained together.
     * @param threadName the {@code threadName} to set
     * @return a reference to this Builder
     */
    public LogEntryBuilder threadName(String threadName) {
        this.threadName = threadName;
        return this;
    }

    /**
     * Sets the {@code loggerName} and returns a reference to this Builder so that the methods can be chained together.
     * @param loggerName the {@code loggerName} to set
     * @return a reference to this Builder
     */
    public LogEntryBuilder loggerName(String loggerName) {
        this.loggerName = loggerName;
        return this;
    }

    /**
     * Sets the {@code message} and returns a reference to this Builder so that the methods can be chained together.
     * @param message the {@code message} to set
     * @return a reference to this Builder
     */
    public LogEntryBuilder message(String message) {
        this.message = message;
        return this;
    }

    /**
     * Sets the {@code throwable} and returns a reference to this Builder so that the methods can be chained together.
     * @param throwable the {@code throwable} to set
     * @return a reference to this Builder
     */
    public LogEntryBuilder throwable(Throwable throwable) {
        this.throwable = throwable;
        return this;
    }

    /**
     * Sets the {@code formattedLogLine} and returns a reference to this Builder so that the methods can be chained together.
     * @param formattedLogLine the {@code formattedLogLine} to set
     * @return a reference to this Builder
     */
    public LogEntryBuilder formattedLogLine(String formattedLogLine) {
        this.formattedLogLine = formattedLogLine;
        return this;
    }

    /**
     * Returns a {@code LogEntry} built from the parameters previously set.
     * @return a {@code LogEntry} built with parameters of this {@code LogEntryBuilder}
     */
    public LogEntry build() {
        return new LogEntry(
                sequenceNumber,
                timestamp,
                level,
                markerName,
                threadName,
                loggerName,
                message,
                throwable,
                formattedLogLine);
    }
}
