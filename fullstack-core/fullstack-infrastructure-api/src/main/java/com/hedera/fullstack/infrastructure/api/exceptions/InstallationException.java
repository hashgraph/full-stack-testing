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
 * <p>Thrown if an exceptions happens during fullstack "cluster setup".
 * The "cluster setup" installs prerequisites on a cluster before a {@link com.hedera.fullstack.infrastructure.api.model.NetworkDeployment} can be deployed.
 * </p>
 *
 * <p>A nested exception is provided to give more details about the cause of the exception.</p>
 */
public class InstallationException extends Exception {
    public InstallationException(String message) {
        super(message);
    }

    public InstallationException(String message, Throwable cause) {
        super(message, cause);
    }
}
