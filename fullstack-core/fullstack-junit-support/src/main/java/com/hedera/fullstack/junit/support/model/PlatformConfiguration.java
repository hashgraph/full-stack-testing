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

package com.hedera.fullstack.junit.support.model;

import java.util.ArrayList;
import java.util.List;

public record PlatformConfiguration(List<ConfigurationValue> configurationValues) {

    public static class Builder {
        private List<ConfigurationValue> configurationValues = new ArrayList<>();

        public Builder configurationValues(List<ConfigurationValue> configurationValues) {
            this.configurationValues = configurationValues;
            return this;
        }

        public Builder addConfigurationValue(ConfigurationValue configurationValue) {
            this.configurationValues.add(configurationValue);
            return this;
        }

        public PlatformConfiguration build() {
            return new PlatformConfiguration(configurationValues);
        }
    }
}
