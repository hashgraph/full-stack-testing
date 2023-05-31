package com.hedera.fullstack.helm.client.proxy.request.repository;

import com.hedera.fullstack.helm.client.execution.HelmExecutionBuilder;
import com.hedera.fullstack.helm.client.model.Repository;
import com.hedera.fullstack.helm.client.proxy.request.HelmRequest;

import java.util.Objects;

public record RepositoryAddRequest(
        Repository repository
) implements HelmRequest {
    public RepositoryAddRequest {
        Objects.requireNonNull(repository, "repository must not be null");
    }

    @Override
    public void apply(HelmExecutionBuilder builder) {
        builder.subcommands("repo", "add")
                .positional(repository.name())
                .positional(repository.url());
    }
}
