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
import com.hedera.fullstack.helm.client.model.test.TestChartOptions;
import com.hedera.fullstack.helm.client.proxy.request.HelmRequest;
import java.util.Objects;

/**
 * A request to uninstall a chart.
 *
 * @param releaseName the name of the release to uninstall.
 */
public record ChartTestRequest(String releaseName, TestChartOptions options) implements HelmRequest {

    public ChartTestRequest {
        Objects.requireNonNull(releaseName, "releaseName must not be null");
        Objects.requireNonNull(options, "options must not be null");

        if (releaseName.isBlank()) {
            throw new IllegalArgumentException("releaseName must not be null or blank");
        }
    }

    /**
     * Creates a new install request with the given chart and default options.
     * @param releaseName The name of the release.
     */
    public ChartTestRequest(String releaseName) {
        this(releaseName, TestChartOptions.defaults());
    }

    @Override
    public void apply(HelmExecutionBuilder builder) {
        builder.subcommands("test");

        if (options != null) {
            options.apply(builder);
        }

        builder.positional(releaseName);
    }
}
