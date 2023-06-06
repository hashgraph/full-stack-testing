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

package com.hedera.fullstack.helm.client;

import com.hedera.fullstack.base.api.version.SemanticVersion;
import com.hedera.fullstack.helm.client.impl.DefaultHelmClientBuilder;
import com.hedera.fullstack.helm.client.model.Repository;
import java.util.List;

/**
 * The {@code HelmClient} is a bridge between Java and the Helm CLI. The client is highly dependent on specific features
 * and versions of the Helm CLI tools; therefore, all implementations are expected to provide a packaged Helm executable
 * of the appropriate version for each supported OS and architecture.
 */
public interface HelmClient {

    /**
     * Executes the Helm CLI {@code version} sub-command and returns the reported version.
     *
     * @return the version of the Helm CLI that is being used by this client.
     */
    SemanticVersion version();

    /**
     * Executes the Helm CLI {@code repo list} sub-command and returns the list of repositories.
     *
     * @return the list of repositories.
     */
    List<Repository> listRepositories();

    /**
     * Executes the Helm CLI {@code repo add} sub-command and adds a new repository.
     *
     * @param repository the repository to add.
     * @throws NullPointerException     if {@code name} or {@code url} is {@code null}.
     * @throws IllegalArgumentException if {@code name} or {@code url} is blank.
     * @throws HelmExecutionException   if the Helm CLI command fails.
     * @throws HelmParserException      if the output of the Helm CLI command cannot be parsed.
     */
    void addRepository(Repository repository);

    /**
     * Executes the Helm CLI {@code repo remove} sub-command and removes a repository.
     * @param repository the repository to remove.
     */
    void removeRepository(Repository repository);

    /**
     * Creates a new {@link HelmClientBuilder} instance with the default configuration.
     *
     * @return a new {@link HelmClientBuilder} instance.
     */
    static HelmClientBuilder builder() {
        return new DefaultHelmClientBuilder();
    }

    /**
     * Creates a new {@link HelmClient} instance with the default configuration.
     * This is a shortcut for {@code HelmClient.builder().build()}.
     *
     * @return a new {@link HelmClient} instance.
     */
    static HelmClient defaultClient() {
        return builder().build();
    }
}
