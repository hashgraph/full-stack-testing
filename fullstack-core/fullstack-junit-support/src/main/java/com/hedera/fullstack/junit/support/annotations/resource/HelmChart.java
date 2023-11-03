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

package com.hedera.fullstack.junit.support.annotations.resource;

import java.lang.annotation.*;

/**
 * Represents a Helm chart identifier in component form (repository, chart, version).
 */
@Inherited
@Documented
@Target({})
@Retention(RetentionPolicy.RUNTIME)
public @interface HelmChart {
    /**
     * The Helm repository URL where the chart is located. This is synonymous with the URL used by the Helm CLI
     * {@code helm repo add <name> <url>} command syntax.
     *
     * @return the Helm repository URL where the chart is located.
     */
    String repository();

    /**
     * The identifier of the Helm chart. This is synonymous with the name used by the Helm CLI
     * {@code helm install <release-name> <chart>} command syntax.
     *
     * @return the Helm chart identifier.
     */
    String chart();

    /**
     * The version of the Helm chart. This must be a valid Semantic Version (SemVer) string as required by the
     * Helm Chart v2 specification.
     *
     * @return the Helm chart semantic version.
     */
    String version();
}
