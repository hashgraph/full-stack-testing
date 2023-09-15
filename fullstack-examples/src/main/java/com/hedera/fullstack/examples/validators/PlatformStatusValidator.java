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

package com.hedera.fullstack.examples.validators;

import com.hedera.fullstack.validator.api.ValidationContext;
import com.hedera.fullstack.validator.api.ValidationResult;
import com.hedera.fullstack.validator.api.Validator;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Future;

public class PlatformStatusValidator implements Validator {

    private PlatformStatusValidator() {}

    public static Builder builder() {
        return new Builder();
    }

    @Override
    public Future<ValidationResult> validate(ValidationContext context) {
        return CompletableFuture.completedFuture(null);
    }

    public static class Builder {
        private Builder() {}

        public PlatformStatusValidator build() {
            return new PlatformStatusValidator();
        }

        public Builder nodeId(String nodeId) {
            return this;
        }

        public Builder steps(String... targetStatuses) {
            return this;
        }
    }
}
