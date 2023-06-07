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

package com.hedera.fullstack.helm.client.proxy.request.chart;

import com.hedera.fullstack.helm.client.execution.HelmExecutionBuilder;
import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.model.install.InstallChartOptions;
import com.hedera.fullstack.helm.client.proxy.request.HelmRequest;

/**
 * Represents a helm install request.
 * @param chart The chart to install.
 * @param options The options to use when installing the chart.
 */
public record ChartInstallRequest(Chart chart, InstallChartOptions options) implements HelmRequest {
    /**
     * Creates a new install request with the given chart and no options.
     * @param chart The chart to install.
     */
    public ChartInstallRequest(Chart chart) {
        this(chart, null);
    }

    @Override
    public void apply(HelmExecutionBuilder builder) {
        builder.subcommands("install");
        if (options != null) {
            if (options.atomic()) {
                builder.flag("--atomic");
            }

            if (options.createNamespace()) {
                builder.flag("--create-namespace");
            }

            if (options.dependencyUpdate()) {
                builder.flag("--dependency-update");
            }

            if (options.enableDNS()) {
                builder.flag("--enable-dns");
            }

            if (options.force()) {
                builder.flag("--force");
            }

            if (options.output() != null) {
                builder.argument("output", options.output());
            }

            if (options.passCredentials()) {
                builder.flag("--pass-credentials");
            }

            if (options.password() != null) {
                builder.argument("password", options.password());
            }

            if (options.repo() != null) {
                builder.argument("repo", options.repo());
            }

            if (options.skipCredentials()) {
                builder.flag("--skip-crds");
            }

            if (options.timeout() != null) {
                builder.argument("timeout", options.timeout().toString());
            }

            if (options.username() != null) {
                builder.argument("username", options.username());
            }

            if (options.values() != null) {
                builder.argument("values", options.values());
            }

            if (options.verify()) {
                builder.flag("--verify");
            }

            if (options.version() != null) {
                builder.argument("version", options.version());
            }

            if (options.waitFor()) {
                builder.flag("--wait");
            }
        }
        builder.positional(chart.name()).positional(chart.url());
    }
}
