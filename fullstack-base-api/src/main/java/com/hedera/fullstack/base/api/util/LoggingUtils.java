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

package com.hedera.fullstack.base.api.util;

import static org.assertj.core.api.Assertions.*;

import com.jcovalent.junit.logging.LogEntry;
import java.util.List;
import org.assertj.core.api.Condition;

public class LoggingUtils {
    /**
     * Private constructor to prevent instantiation of this utility class.
     */
    private LoggingUtils() {}

    /**
     * Asserts that the given log entries contain the expected log entries only matching the level and message.
     * @param logEntries the log entries to check
     * @param expectedLogEntries the expected log entries
     */
    public static void assertThatLogEntriesHaveMessages(List<LogEntry> logEntries, List<LogEntry> expectedLogEntries) {
        assertThat(logEntries).isNotNull();
        for (LogEntry logEntry : expectedLogEntries) {
            assertThat(logEntries)
                    .haveAtLeastOne(new Condition<>(
                            entry -> entry.level() == logEntry.level()
                                    && entry.message().contains(logEntry.message()),
                            "message contains '" + logEntry.message() + "'"));
        }
    }
}
