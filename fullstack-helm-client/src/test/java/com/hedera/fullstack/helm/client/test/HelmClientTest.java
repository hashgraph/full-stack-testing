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

import static com.hedera.fullstack.base.api.util.ExceptionUtils.suppressExceptions;
import static org.assertj.core.api.Assertions.*;

import com.hedera.fullstack.base.api.version.SemanticVersion;
import com.hedera.fullstack.helm.client.HelmClient;
import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.model.Repository;
import com.hedera.fullstack.helm.client.model.install.InstallChartOptions;
import java.util.List;
import org.junit.jupiter.api.*;

@DisplayName("Helm Client Tests")
class HelmClientTest {

    /**
     * The repository for the ingress-nginx helm chart.
     */
    private static final Repository INGRESS_REPOSITORY =
            new Repository("ingress-nginx", "https://kubernetes.github.io/ingress-nginx");

    private static final Repository HAPROXYTECH_REPOSITORY =
            new Repository("haproxytech", "https://haproxytech.github.io/helm-charts");
    private static final Chart HAPROXY_CHART = new Chart("haproxy", "haproxytech/haproxy");
    private static final Chart HAPROXY_CHART_UNQUALIFIED = new Chart("haproxy", "haproxy");

    private static HelmClient defaultClient;

    @BeforeAll
    static void beforeAll() {
        defaultClient = HelmClient.defaultClient();
        assertThat(defaultClient).isNotNull();
    }

    void removeRepoIfPresent(HelmClient client, Repository repo) {
        final List<Repository> repositories = client.listRepositories();
        if (repositories.contains(repo)) {
            client.removeRepository(repo);
        }
    }

    @Test
    @DisplayName("Version Command Executes Successfully")
    void testVersionCommand() {
        final SemanticVersion helmVersion = defaultClient.version();
        assertThat(helmVersion).isNotNull().isNotEqualTo(SemanticVersion.ZERO);

        assertThat(helmVersion.major()).isGreaterThanOrEqualTo(3);
        assertThat(helmVersion.minor()).isGreaterThanOrEqualTo(12);
        assertThat(helmVersion.patch()).isNotNegative();
    }

    @Test
    @DisplayName("Repository List Executes Successfully")
    void testRepositoryListCommand() {
        final List<Repository> repositories = defaultClient.listRepositories();
        assertThat(repositories).isNotNull();
    }

    @Test
    @DisplayName("Repository Add Executes Successfully")
    void testRepositoryAddCommand() {
        final int originalRepoListSize = defaultClient.listRepositories().size();
        removeRepoIfPresent(defaultClient, INGRESS_REPOSITORY);

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
        removeRepoIfPresent(defaultClient, INGRESS_REPOSITORY);

        int existingRepoCount = defaultClient.listRepositories().size();
        final String expectedMessage;

        if (existingRepoCount == 0) {
            expectedMessage = "Error: no repositories configured";
        } else {
            expectedMessage = String.format("Error: no repo named \"%s\" found", INGRESS_REPOSITORY.name());
        }

        assertThatException()
                .isThrownBy(() -> defaultClient.removeRepository(INGRESS_REPOSITORY))
                .withMessageContaining(expectedMessage);
    }

    @Test
    @DisplayName("Install Chart with Options")
    void testInstallChartWithOptionsCommand() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .dependencyUpdate(true)
                .description("Test install chart with options")
                .enableDNS(true)
                .force(true)
                .output("table") // Note: json & yaml output hangs and doesn't complete
                .password("password")
                .skipCrds(true)
                .timeout("9m0s")
                .username("username")
                .version("9.6.3")
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Atomic Chart Installation Executes Successfully")
    void testAtomicChartInstall() { // failed atomic
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .atomic(true) // Note: fails when ran independently
                .createNamespace(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart Executes Successfully")
    void testInstallChartCommand() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Dependency Updates")
    void testInstallChartWithDependencyUpdates() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .dependencyUpdate(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Description")
    void testInstallChartWithDescription() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .description("Test install chart with options")
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with DNS Enabled")
    void testInstallChartWithDnsEnabled() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .enableDNS(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Forced Chart Installation")
    void testForcedChartInstallation() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options =
                InstallChartOptions.builder().createNamespace(true).force(true).build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Tabular Output")
    void testInstallChartWithTableOutput() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .output("table") // Note: json & yaml output hangs and doesn't complete
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Password")
    void testInstallChartWithPassword() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .password("password")
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart From Repository")
    void testInstallChartFromRepo() { // fails with .repo(BITNAMI_REPOSITORY.url())
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .repo(HAPROXYTECH_REPOSITORY.url()) // also fails
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART_UNQUALIFIED));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART_UNQUALIFIED, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART_UNQUALIFIED));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart Skipping CRDs")
    void testInstallChartSkippingCrds() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .skipCrds(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Timeout")
    @Timeout(value = 90)
    void testInstallChartWithTimeout() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .timeout("60s")
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Username")
    void testInstallChartWithUsername() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .username("username")
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Provenance Validation")
    @Disabled("Provenance validation is not supported in our unit tests due to lack of signed charts.")
    void testInstallChartWithProvenanceValidation() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options =
                InstallChartOptions.builder().createNamespace(true).verify(true).build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Specific Version")
    void testInstallChartVersion() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .version("1.18.0")
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Wait")
    void testInstallChartWithWait() { // fails
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                .createNamespace(true)
                .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(HAPROXY_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }
}
