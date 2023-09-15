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

package com.hedera.fullstack.base.api.test.collections;

import static org.assertj.core.api.Assertions.assertThat;

import com.hedera.fullstack.base.api.collections.KeyValuePair;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class KeyValuePairTest {
    @Test
    @DisplayName("Test KeyValuePair")
    void testKeyValuePair() {
        KeyValuePair<String, String> kvp1 = new KeyValuePair<>("key", "value");
        KeyValuePair<String, String> kvp1v2 = new KeyValuePair<>("key", "value2");
        assertThat(kvp1).isEqualTo(kvp1v2);
        assertThat(kvp1.hashCode()).isEqualTo(kvp1v2.hashCode());
    }
}
