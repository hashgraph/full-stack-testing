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

package com.hedera.fullstack.helm.client.test.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;

import com.hedera.fullstack.helm.client.HelmExecutionException;
import com.hedera.fullstack.helm.client.execution.HelmExecution;
import com.jcovalent.junit.logging.JCovalentLoggingSupport;
import com.jcovalent.junit.logging.LogEntryBuilder;
import com.jcovalent.junit.logging.LoggingOutput;
import com.jcovalent.junit.logging.assertj.LoggingOutputAssert;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.event.Level;

@JCovalentLoggingSupport
@ExtendWith(MockitoExtension.class)
class HelmExecutionTest {
    @Mock
    private Process processMock;

    @Mock
    private InputStream inputStreamMock;

    @Test
    @DisplayName("Test call with timeout throws exception and logs warning message")
    void testCallWarnMessage(final LoggingOutput loggingOutput) throws InterruptedException, IOException {
        doReturn(inputStreamMock).when(processMock).getInputStream();
        doReturn(inputStreamMock).when(processMock).getErrorStream();
        final HelmExecution helmExecution = Mockito.spy(new HelmExecution(processMock));
        final Duration timeout = Duration.ofSeconds(1);
        doReturn(1).when(helmExecution).exitCode();
        doReturn(true).when(helmExecution).waitFor(any(Duration.class));
        doReturn(inputStreamMock).when(helmExecution).standardOutput();
        doReturn(inputStreamMock).when(helmExecution).standardError();

        HelmExecutionException exception = assertThrows(HelmExecutionException.class, () -> {
            helmExecution.call(timeout);
        });

        assertThat(exception.getMessage()).contains("Execution of the Helm command failed with exit code: 1");
        LoggingOutputAssert.assertThatLogEntriesHaveMessages(
                loggingOutput,
                List.of(
                        LogEntryBuilder.builder()
                                .level(Level.WARN)
                                .message("Call failed with exitCode: 1")
                                .build(),
                        LogEntryBuilder.builder()
                                .level(Level.DEBUG)
                                .message("Call exiting with exitCode: 1")
                                .build()));
    }
}
