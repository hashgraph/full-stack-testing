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
import static org.junit.jupiter.api.Named.named;

import com.hedera.fullstack.base.api.version.SemanticVersion;
import com.hedera.fullstack.helm.client.HelmClient;
import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.model.Repository;
import com.hedera.fullstack.helm.client.model.chart.Release;
import com.hedera.fullstack.helm.client.model.install.InstallChartOptions;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

@DisplayName("Helm Client Tests")
class HelmClientTest {

    /**
     * The repository for the ingress-nginx helm chart.
     */
    private static final Repository INGRESS_REPOSITORY =
            new Repository("ingress-nginx", "https://kubernetes.github.io/ingress-nginx");

    private static final Repository HAPROXYTECH_REPOSITORY =
            new Repository("haproxytech", "https://haproxytech.github.io/helm-charts");
    private static final Chart HAPROXY_CHART = new Chart("haproxy", "haproxytech");

    private static final String HAPROXY_RELEASE_NAME = "haproxy-release";

    private static HelmClient defaultClient;
    private static final int INSTALL_TIMEOUT = 10;

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
                .withStackTraceContaining(expectedMessage);
    }

    @Test
    @DisplayName("Install Chart Executes Successfully")
    @Timeout(INSTALL_TIMEOUT)
    void testInstallChartCommand() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_RELEASE_NAME));
            Release release = defaultClient.installChart(HAPROXY_RELEASE_NAME, HAPROXY_CHART);
            assertThat(release).isNotNull();
            assertThat(release.name()).isEqualTo(HAPROXY_RELEASE_NAME);
            assertThat(release.info().description()).isEqualTo("Install complete");
            assertThat(release.info().status()).isEqualTo("deployed");
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_RELEASE_NAME));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    private static void testChartInstallWithCleanup(InstallChartOptions options) {
        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(HAPROXYTECH_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_RELEASE_NAME));
            Release release = defaultClient.installChart(HAPROXY_RELEASE_NAME, HAPROXY_CHART, options);
            assertThat(release).isNotNull();
            assertThat(release.name()).isEqualTo(HAPROXY_RELEASE_NAME);
            assertThat(release.info().description()).isEqualTo("Install complete");
            assertThat(release.info().status()).isEqualTo("deployed");
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(HAPROXY_RELEASE_NAME));
            suppressExceptions(() -> defaultClient.removeRepository(HAPROXYTECH_REPOSITORY));
        }
    }

    @ParameterizedTest
    @Timeout(INSTALL_TIMEOUT)
    @MethodSource
    @DisplayName("Parameterized Chart Installation with Options Executes Successfully")
    void testChartInstallOptions(InstallChartOptions options) {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);
        testChartInstallWithCleanup(options);
    }

    static Stream<Named<InstallChartOptions>> testChartInstallOptions() {
        return Stream.of(
                named(
                        "Atomic Chart Installation Executes Successfully",
                        InstallChartOptions.builder()
                                .atomic(true)
                                .createNamespace(true)
                                .build()),
                named(
                        "Install Chart with Combination of Options Executes Successfully",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .dependencyUpdate(true)
                                .description("Test install chart with options")
                                .enableDNS(true)
                                .force(true)
                                .skipCrds(true)
                                .timeout("3m0s")
                                .username("username")
                                .password("password")
                                .version("1.18.0")
                                .build()),
                named(
                        "Install Chart with Dependency Updates",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .dependencyUpdate(true)
                                .build()),
                named(
                        "Install Chart with Description",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .description("Test install chart with options")
                                .build()),
                named(
                        "Install Chart with DNS Enabled",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .enableDNS(true)
                                .build()),
                named(
                        "Forced Chart Installation",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .force(true)
                                .build()),
                named(
                        "Install Chart with Password",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .password("password")
                                .build()),
                named(
                        "Install Chart From Repository",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .repo(HAPROXYTECH_REPOSITORY.url())
                                .build()),
                named(
                        "Install Chart Skipping CRDs",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .skipCrds(true)
                                .build()),
                named(
                        "Install Chart with Timeout",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .timeout("60s")
                                .build()),
                named(
                        "Install Chart with Username",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .username("username")
                                .build()),
                named(
                        "Install Chart with Specific Version",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .version("1.18.0")
                                .build()),
                named(
                        "Install Chart with Wait",
                        InstallChartOptions.builder()
                                .createNamespace(true)
                                .waitFor(true)
                                .build()));
    }

    @Test
    @DisplayName("Install Chart with Provenance Validation")
    @Disabled("Provenance validation is not supported in our unit tests due to lack of signed charts.")
    void testInstallChartWithProvenanceValidation() {
        removeRepoIfPresent(defaultClient, HAPROXYTECH_REPOSITORY);

        final InstallChartOptions options =
                InstallChartOptions.builder().createNamespace(true).verify(true).build();

        testChartInstallWithCleanup(options);
    }
}
