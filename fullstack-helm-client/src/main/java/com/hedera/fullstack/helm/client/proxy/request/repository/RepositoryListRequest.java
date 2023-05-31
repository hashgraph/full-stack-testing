package com.hedera.fullstack.helm.client.proxy.request.repository;

import com.hedera.fullstack.helm.client.execution.HelmExecutionBuilder;
import com.hedera.fullstack.helm.client.proxy.request.HelmRequest;

public record RepositoryListRequest() implements HelmRequest {
    @Override
    public void apply(HelmExecutionBuilder builder) {
        builder.subcommands("repo", "list").argument("output", "json");
    }
}
