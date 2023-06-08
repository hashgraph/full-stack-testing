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

package com.hedera.fullstack.base.api.test.util;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.hedera.fullstack.base.api.util.StreamUtils;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StreamUtilsTest {

    @Test
    @DisplayName("Verify streamToString works as expected")
    void testStreamToString() {
        final String testString = "This is a test string";
        final InputStream inputStream = new ByteArrayInputStream(testString.getBytes());
        final String result = StreamUtils.streamToString(inputStream);
        assertThat(testString).isEqualTo(result);
    }

    @Test
    @DisplayName("Verify streamToString works as expected with null input")
    void testStreamToStringNullInput() {
        assertThatNullPointerException().isThrownBy(() -> StreamUtils.streamToString(null));
    }

    @Test
    @DisplayName("Verify streamToString handles IOExceptions")
    void testStreamToStringIOExceptions(@Mock InputStream inputStream) {
        assertThatCode(() -> doThrow(new IOException("test exception"))
                        .when(inputStream)
                        .read(any(byte[].class), anyInt(), anyInt()))
                .doesNotThrowAnyException();

        assertThat(StreamUtils.streamToString(inputStream)).isNotBlank().contains("... interrupted by: test exception");
    }
}
