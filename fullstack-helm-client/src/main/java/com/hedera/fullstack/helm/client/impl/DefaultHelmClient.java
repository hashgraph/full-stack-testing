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

package com.hedera.fullstack.helm.client.impl;

import com.hedera.fullstack.base.api.version.SemanticVersion;
import com.hedera.fullstack.helm.client.HelmClient;
import com.hedera.fullstack.helm.client.execution.HelmExecutionBuilder;
import com.hedera.fullstack.helm.client.model.request.HelmRequest;
import com.hedera.fullstack.helm.client.model.request.authentication.KubeAuthentication;
import com.hedera.fullstack.helm.client.model.request.common.VersionRequest;
import com.hedera.fullstack.helm.client.model.response.common.VersionResponse;
import java.nio.file.Path;
import java.util.Objects;

/**
 * The default implementation of the {@link HelmClient} interface.
 */
public final class DefaultHelmClient implements HelmClient {

    /**
     * The path to the Helm executable.
     */
    private final Path helmExecutable;

    /**
     * The authentication configuration to use when executing Helm commands.
     */
    private final KubeAuthentication authentication;

    /**
     * The default namespace to use when executing Helm commands.
     */
    private final String defaultNamespace;

    /**
     * Creates a new instance of the {@link DefaultHelmClient} class.
     *
     * @param helmExecutable the path to the Helm executable.
     * @param authentication the authentication configuration to use when executing Helm commands.
     * @param defaultNamespace the default namespace to use when executing Helm commands.
     */
    public DefaultHelmClient(
            final Path helmExecutable, final KubeAuthentication authentication, final String defaultNamespace) {
        this.helmExecutable = Objects.requireNonNull(helmExecutable, "helmExecutable must not be null");
        this.authentication = Objects.requireNonNull(authentication, "authentication must not be null");
        this.defaultNamespace = defaultNamespace;
    }

    @Override
    public SemanticVersion version() {
        return execute(new VersionRequest(), VersionResponse.class).asSemanticVersion();
    }

    /**
     * Applies the default namespace and authentication configuration to the given builder.
     *
     * @param builder the builder to apply to which the defaults should be applied.
     */
    private void applyBuilderDefaults(final HelmExecutionBuilder builder) {
        if (defaultNamespace != null && !defaultNamespace.isBlank()) {
            builder.argument("namespace", defaultNamespace);
        }

        authentication.apply(builder);
    }

    /**
     * Executes the given request and returns the response as the given class. The request is executed using the default namespace.
     *
     * @param request       the request to execute.
     * @param responseClass the class of the response.
     * @param <T>           the type of the request.
     * @param <R>           the type of the response.
     * @return the response.
     */
    private <T extends HelmRequest, R> R execute(final T request, final Class<R> responseClass) {
        final HelmExecutionBuilder builder = new HelmExecutionBuilder(helmExecutable);
        applyBuilderDefaults(builder);
        request.apply(builder);
        return builder.build().responseAs(responseClass);
    }

    /**
     * Executes the given request and returns the response as the given class with the specified namespace.
     *
     * @param namespace     the namespace to use.
     * @param request       the request to execute.
     * @param responseClass the class of the response.
     * @param <T>           the type of the request.
     * @param <R>           the type of the response.
     * @return the response.
     */
    private <T extends HelmRequest, R> R execute(
            final String namespace, final T request, final Class<R> responseClass) {
        Objects.requireNonNull(namespace, "namespace must not be null");

        if (namespace.isBlank()) {
            throw new IllegalArgumentException("namespace must not be blank");
        }

        final HelmExecutionBuilder builder = new HelmExecutionBuilder(helmExecutable);
        applyBuilderDefaults(builder);
        request.apply(builder);
        builder.argument("namespace", namespace);
        return builder.build().responseAs(responseClass);
    }
}
