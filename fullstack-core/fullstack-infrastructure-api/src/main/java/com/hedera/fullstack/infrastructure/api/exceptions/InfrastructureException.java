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

package com.hedera.fullstack.infrastructure.api.exceptions;

/**
 *
 * <p>Thrown when an infrastructure-related exception occurs at the lower level of the implementation.</p>
 * <p>A nested exception (cause) should be provided to capture the root cause of the exception.</p>
 * <p>This is not necessarily a fatal exception and the network deployment may be able to recover from it depending on the cause.</p>
 *
 */
public class InfrastructureException extends Exception {
    InfrastructureException(String message) {
        super(message);
    }

    InfrastructureException(String message, Throwable cause) {
        super(message, cause);
    }
}
