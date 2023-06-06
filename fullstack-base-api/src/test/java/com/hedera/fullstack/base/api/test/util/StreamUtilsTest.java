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

import static org.junit.jupiter.api.Assertions.*;

import com.hedera.fullstack.base.api.util.StreamUtils;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class StreamUtilsTest {

    @Test
    @DisplayName("Test streamToString")
    void streamToString() {
        String testString = "This is a test string";
        InputStream inputStream = new ByteArrayInputStream(testString.getBytes());
        String result = StreamUtils.streamToString(inputStream);
        assertEquals(testString, result);
    }
}
