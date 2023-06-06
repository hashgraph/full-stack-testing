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

package com.hedera.fullstack.helm.client.test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatException;
import static org.assertj.core.api.Assertions.assertThatNoException;

import com.hedera.fullstack.base.api.version.SemanticVersion;
import com.hedera.fullstack.helm.client.HelmClient;
import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.model.Repository;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Helm Client Tests")
class HelmClientTest {

    /**
     * The repository for the ingress-nginx helm chart.
     */
    private static final Repository INGRESS_REPOSITORY =
            new Repository("ingress-nginx", "https://kubernetes.github.io/ingress-nginx");

    private static final Repository BITNAMI_REPOSITORY =
            new Repository("bitnami", "https://charts.bitnami.com/bitnami");

    private static final Chart APACHE_CHART = new Chart("apache", "bitnami/apache");

    //    private static final Chart INGRESS_CHART = new Chart("ingress-nginx", "ingress-nginx/ingress-nginx");

    @Test
    @DisplayName("Version Command Executes Successfully")
    void testVersionCommand() {
        final HelmClient defaultClient = HelmClient.defaultClient();
        assertThat(defaultClient).isNotNull();

        final SemanticVersion helmVersion = defaultClient.version();
        assertThat(helmVersion).isNotNull().isNotEqualTo(SemanticVersion.ZERO);

        assertThat(helmVersion.major()).isGreaterThanOrEqualTo(3);
        assertThat(helmVersion.minor()).isGreaterThanOrEqualTo(12);
        assertThat(helmVersion.patch()).isNotNegative();
    }

    @Test
    @DisplayName("Repository List Executes Successfully")
    void testRepositoryListCommand() {
        final HelmClient defaultClient = HelmClient.defaultClient();
        assertThat(defaultClient).isNotNull();
        final List<Repository> repositories = defaultClient.listRepositories();
        assertThat(repositories).isNotNull();
    }

    @Test
    @DisplayName("Repository Add Executes Successfully")
    void testRepositoryAddCommand() {
        final HelmClient defaultClient = HelmClient.defaultClient();
        assertThat(defaultClient).isNotNull();
        final int originalRepoListSize = defaultClient.listRepositories().size();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(INGRESS_REPOSITORY));
            final List<Repository> repositories = defaultClient.listRepositories();
            assertThat(repositories)
                    .isNotNull()
                    .isNotEmpty()
                    .contains(INGRESS_REPOSITORY)
                    .hasSize(originalRepoListSize + 1);
        } finally {
            assertThatNoException().isThrownBy(() -> defaultClient.removeRepository(INGRESS_REPOSITORY));
            final List<Repository> repositories = defaultClient.listRepositories();
            assertThat(repositories).isNotNull().hasSize(originalRepoListSize);
        }
    }

    @Test
    @DisplayName("Repository Remove Executes With Error")
    void testRepositoryRemoveCommand_WithError() {
        final HelmClient defaultClient = HelmClient.defaultClient();
        assertThat(defaultClient).isNotNull();
        if (defaultClient.listRepositories().contains(INGRESS_REPOSITORY)) {
            defaultClient.removeRepository(INGRESS_REPOSITORY);
        }
        assertThatException()
                .isThrownBy(() -> defaultClient.removeRepository(INGRESS_REPOSITORY))
                .withMessageContaining("Error: no repositories configured");
    }

    @Test
    @DisplayName("Install Chart Executes Successfully")
    void testInstallChartCommand() throws InterruptedException {
        final HelmClient defaultClient = HelmClient.defaultClient();
        assertThat(defaultClient).isNotNull();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART));
            Thread.sleep(5000);
        } finally {
            assertThatNoException().isThrownBy(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }
}
