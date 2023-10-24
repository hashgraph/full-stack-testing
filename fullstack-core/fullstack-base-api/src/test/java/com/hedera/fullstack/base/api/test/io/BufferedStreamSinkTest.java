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

package com.hedera.fullstack.base.api.test.io;

import static com.hedera.fullstack.base.api.util.ThreadUtils.newPerpetualThread;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.hedera.fullstack.base.api.io.BufferedStreamSink;
import com.hedera.fullstack.base.api.threading.ThreadBuilder;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class BufferedStreamSinkTest {
    @Test
    @DisplayName("Getter: Source")
    void testGetterSource() {
        final InputStream source = new ByteArrayInputStream(new byte[0]);
        final BufferedStreamSink bss = new BufferedStreamSink(source);

        assertThat(bss)
                .isNotNull()
                .extracting(BufferedStreamSink::getSource)
                .isEqualTo(source)
                .isSameAs(source);
    }

    @Test
    @DisplayName("Getter: DataStream")
    void testGetterDataStream() throws IOException {
        final InputStream source = new ByteArrayInputStream(new byte[0]);
        final BufferedStreamSink bss = new BufferedStreamSink(source);

        assertThatThrownBy(bss::getDataStream).isInstanceOf(IllegalStateException.class);

        // Test Closure
        final InputStream originalEndStream = bss.end();

        assertThat(bss)
                .isNotNull()
                .extracting(BufferedStreamSink::getDataStream)
                .isNotEqualTo(source)
                .isNotSameAs(source)
                .isInstanceOf(ByteArrayInputStream.class)
                .isSameAs(originalEndStream);
    }

    @Test
    @DisplayName("Constructor: Throws NullPointerException")
    void testConstructorThrowsNullPointerException() {
        assertThatThrownBy(() -> {
                    try (final BufferedStreamSink bss = new BufferedStreamSink(null)) {
                        // intentionally blank
                    }
                })
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("Constructor: Throws IllegalArgumentException")
    @SuppressWarnings("EmptyTryBlock")
    void testConstructorThrowsIllegalArgumentException() {
        final InputStream source = new ByteArrayInputStream(new byte[0]);
        assertThatThrownBy(() -> {
                    try (final BufferedStreamSink bss = new BufferedStreamSink(source, 0)) {
                        // intentionally blank
                    }
                })
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> {
                    try (final BufferedStreamSink bss = new BufferedStreamSink(source, -100)) {
                        // intentionally blank
                    }
                })
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Begin(): Throws IllegalStateException")
    void testBeginThrowsIllegalStateException() {
        final Thread runningThread = mock(Thread.class);
        final ThreadBuilder threadBuilder = spy(new ThreadBuilder());
        final InputStream source = new ByteArrayInputStream(new byte[0]);

        doReturn(Thread.State.RUNNABLE).when(runningThread).getState();
        doReturn(runningThread).when(threadBuilder).build();

        final BufferedStreamSink bss =
                new BufferedStreamSink(source, BufferedStreamSink.BUFFER_SIZE, () -> threadBuilder);
        assertThatThrownBy(bss::begin).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("End(): Subsequent Calls Return Same Stream")
    void testEndSubsequentCallsSameStream() throws IOException {
        final ThreadBuilder threadBuilder = spy(new ThreadBuilder());
        final InputStream source = new ByteArrayInputStream(new byte[0]);

        doReturn(newPerpetualThread()).when(threadBuilder).build();
        final BufferedStreamSink bss =
                new BufferedStreamSink(source, BufferedStreamSink.BUFFER_SIZE, () -> threadBuilder);

        final InputStream originalEndStream = bss.begin().end();
        assertThat(originalEndStream).isNotNull();

        assertThat(bss.end())
                .isNotNull()
                .isSameAs(originalEndStream)
                .isNotSameAs(source)
                .isNotEqualTo(source);
    }
}
