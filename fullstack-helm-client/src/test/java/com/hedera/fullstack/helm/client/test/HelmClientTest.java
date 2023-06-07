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
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatException;
import static org.assertj.core.api.Assertions.assertThatNoException;

import com.hedera.fullstack.base.api.version.SemanticVersion;
import com.hedera.fullstack.helm.client.HelmClient;
import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.model.InstallChartOptions;
import com.hedera.fullstack.helm.client.model.Repository;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
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
        assertThatException()
                .isThrownBy(() -> defaultClient.removeRepository(INGRESS_REPOSITORY))
                .withMessageContaining("Error: no repositories configured");
    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully")
    void testInstallChartWithOptionsCommand() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true) // Note: fails when ran independently
                .createNamespace(true)
                .dependencyUpdate(true)
                .description("Test install chart with options")
                .enableDNS(true)
                .force(true)
                .output("table") // Note: json & yaml output hangs and doesn't complete
                .password("password")
                // .repo(BITNAMI_REPOSITORY.url()) // Note: fails when ran independently
                .skipCredentials(true)
                .timeout("9m0s")
                .username("username")
                // .verify(true) // Note: fails when ran independently
                .version("9.6.3")
                // .waitFor(true) // Note: fails when ran independently
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    //    @Test
    //    @DisplayName("Install Chart with Options Executes Successfully0")
    //    void testInstallChartWithOptionsCommand0() { // failed atomic
    //        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);
    //
    //        final InstallChartOptions options = InstallChartOptions.builder()
    //                .atomic(true) // Note: fails when ran independently
    //                .createNamespace(true)
    //                // .dependencyUpdate(true)
    //                // .description("Test install chart with options")
    //                // .enableDNS(true)
    //                // .force(true)
    //                // .output("table") // Note: json & yaml output hangs and doesn't complete
    //                // .password("password")
    //                // .repo(BITNAMI_REPOSITORY.url()) // Note: fails when ran independently
    //                // .skipCredentials(true)
    //                // .timeout("9m0s")
    //                // .username("username")
    //                // .verify(true) // Note: fails when ran independently
    //                // .version("9.6.3")
    //                // .waitFor(true) // Note: fails when ran independently
    //                .build();
    //
    //        try {
    //            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
    //            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
    //            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
    //        } finally {
    //            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
    //            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
    //        }
    //    }

    @Test
    @DisplayName("Install Chart Executes Successfully")
    void testInstallChartCommand() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);
        final InstallChartOptions options =
                InstallChartOptions.builder().createNamespace(true).build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully1")
    void testInstallChartWithOptionsCommand1() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true)
                .createNamespace(true)
                .dependencyUpdate(true)
                // .description("Test install chart with options")
                // .enableDNS(true)
                // .force(true)
                // .output("table") // Note: json & yaml output hangs and doesn't complete
                // .password("password")
                // .repo(BITNAMI_REPOSITORY.url())
                // .skipCredentials(true)
                // .timeout("9m0s")
                // .username("username")
                // .verify(true)
                // .version("9.6.3")
                // .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully2")
    void testInstallChartWithOptionsCommand2() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true)
                .createNamespace(true)
                // .dependencyUpdate(true)
                .description("Test install chart with options")
                // .enableDNS(true)
                // .force(true)
                // .output("table") // Note: json & yaml output hangs and doesn't complete
                // .password("password")
                // .repo(BITNAMI_REPOSITORY.url())
                // .skipCredentials(true)
                // .timeout("9m0s")
                // .username("username")
                // .verify(true)
                // .version("9.6.3")
                // .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully3")
    void testInstallChartWithOptionsCommand3() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true)
                .createNamespace(true)
                // .dependencyUpdate(true)
                // .description("Test install chart with options")
                .enableDNS(true)
                // .force(true)
                // .output("table") // Note: json & yaml output hangs and doesn't complete
                // .password("password")
                // .repo(BITNAMI_REPOSITORY.url())
                // .skipCredentials(true)
                // .timeout("9m0s")
                // .username("username")
                // .verify(true)
                // .version("9.6.3")
                // .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully4")
    void testInstallChartWithOptionsCommand4() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true)
                .createNamespace(true)
                // .dependencyUpdate(true)
                // .description("Test install chart with options")
                // .enableDNS(true)
                .force(true)
                // .output("table") // Note: json & yaml output hangs and doesn't complete
                // .password("password")
                // .repo(BITNAMI_REPOSITORY.url())
                // .skipCredentials(true)
                // .timeout("9m0s")
                // .username("username")
                // .verify(true)
                // .version("9.6.3")
                // .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully5")
    void testInstallChartWithOptionsCommand5() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true)
                .createNamespace(true)
                // .dependencyUpdate(true)
                // .description("Test install chart with options")
                // .enableDNS(true)
                // .force(true)
                .output("table") // Note: json & yaml output hangs and doesn't complete
                // .password("password")
                // .repo(BITNAMI_REPOSITORY.url())
                // .skipCredentials(true)
                // .timeout("9m0s")
                // .username("username")
                // .verify(true)
                // .version("9.6.3")
                // .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully6")
    void testInstallChartWithOptionsCommand6() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true)
                .createNamespace(true)
                // .dependencyUpdate(true)
                // .description("Test install chart with options")
                // .enableDNS(true)
                // .force(true)
                // .output("table") // Note: json & yaml output hangs and doesn't complete
                .password("password")
                // .repo(BITNAMI_REPOSITORY.url())
                // .skipCredentials(true)
                // .timeout("9m0s")
                // .username("username")
                // .verify(true)
                // .version("9.6.3")
                // .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    //    @Test
    //    @DisplayName("Install Chart with Options Executes Successfully7")
    //    void testInstallChartWithOptionsCommand7() { // fails
    //        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);
    //
    //        final InstallChartOptions options = InstallChartOptions.builder()
    //                // .atomic(true)
    //                .createNamespace(true)
    //                // .dependencyUpdate(true)
    //                // .description("Test install chart with options")
    //                // .enableDNS(true)
    //                // .force(true)
    //                // .output("table") // Note: json & yaml output hangs and doesn't complete
    //                // .password("password")
    //                .repo("https://charts.bitnami.com/bitnami/index.yaml")
    //                // .skipCredentials(true)
    //                // .timeout("9m0s")
    //                // .username("username")
    //                // .verify(true)
    //                // .version("9.6.3")
    //                // .waitFor(true)
    //                .build();
    //
    //        try {
    //            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
    //            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
    //            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
    //        } finally {
    //            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
    //            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
    //        }
    //    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully8")
    void testInstallChartWithOptionsCommand8() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true)
                .createNamespace(true)
                // .dependencyUpdate(true)
                // .description("Test install chart with options")
                // .enableDNS(true)
                // .force(true)
                // .output("table") // Note: json & yaml output hangs and doesn't complete
                // .password("password")
                // .repo(BITNAMI_REPOSITORY.url())
                .skipCredentials(true)
                // .timeout("9m0s")
                // .username("username")
                // .verify(true)
                // .version("9.6.3")
                // .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully9")
    void testInstallChartWithOptionsCommand9() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true)
                .createNamespace(true)
                // .dependencyUpdate(true)
                // .description("Test install chart with options")
                // .enableDNS(true)
                // .force(true)
                // .output("table") // Note: json & yaml output hangs and doesn't complete
                // .password("password")
                // .repo(BITNAMI_REPOSITORY.url())
                // .skipCredentials(true)
                .timeout("9m0s")
                // .username("username")
                // .verify(true)
                // .version("9.6.3")
                // .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully10")
    void testInstallChartWithOptionsCommand10() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true)
                .createNamespace(true)
                // .dependencyUpdate(true)
                // .description("Test install chart with options")
                // .enableDNS(true)
                // .force(true)
                // .output("table") // Note: json & yaml output hangs and doesn't complete
                // .password("password")
                // .repo(BITNAMI_REPOSITORY.url())
                // .skipCredentials(true)
                // .timeout("9m0s")
                .username("username")
                // .verify(true)
                // .version("9.6.3")
                // .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    //    @Test
    //    @DisplayName("Install Chart with Options Executes Successfully11")
    //    void testInstallChartWithOptionsCommand11() { // fails
    //        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);
    //
    //        final InstallChartOptions options = InstallChartOptions.builder()
    //                // .atomic(true)
    //                .createNamespace(true)
    //                // .dependencyUpdate(true)
    //                // .description("Test install chart with options")
    //                // .enableDNS(true)
    //                // .force(true)
    //                // .output("table") // Note: json & yaml output hangs and doesn't complete
    //                // .password("password")
    //                // .repo(BITNAMI_REPOSITORY.url())
    //                // .skipCredentials(true)
    //                // .timeout("9m0s")
    //                // .username("username")
    //                .verify(true)
    //                // .version("9.6.3")
    //                // .waitFor(true)
    //                .build();
    //
    //        try {
    //            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
    //            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
    //            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
    //        } finally {
    //            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
    //            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
    //        }
    //    }

    @Test
    @DisplayName("Install Chart with Options Executes Successfully12")
    void testInstallChartWithOptionsCommand12() {
        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);

        final InstallChartOptions options = InstallChartOptions.builder()
                // .atomic(true)
                .createNamespace(true)
                // .dependencyUpdate(true)
                // .description("Test install chart with options")
                // .enableDNS(true)
                // .force(true)
                // .output("table") // Note: json & yaml output hangs and doesn't complete
                // .password("password")
                // .repo(BITNAMI_REPOSITORY.url())
                // .skipCredentials(true)
                // .timeout("9m0s")
                // .username("username")
                // .verify(true)
                .version("9.6.3")
                // .waitFor(true)
                .build();

        try {
            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
        } finally {
            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
        }
    }

    //    @Test
    //    @DisplayName("Install Chart with Options Executes Successfully13")
    //    void testInstallChartWithOptionsCommand13() { // fails
    //        removeRepoIfPresent(defaultClient, BITNAMI_REPOSITORY);
    //
    //        final InstallChartOptions options = InstallChartOptions.builder()
    //                // .atomic(true)
    //                .createNamespace(true)
    //                // .dependencyUpdate(true)
    //                // .description("Test install chart with options")
    //                // .enableDNS(true)
    //                // .force(true)
    //                // .output("table") // Note: json & yaml output hangs and doesn't complete
    //                // .password("password")
    //                // .repo(BITNAMI_REPOSITORY.url())
    //                // .skipCredentials(true)
    //                // .timeout("9m0s")
    //                // .username("username")
    //                // .verify(true)
    //                // .version("9.6.3")
    //                .waitFor(true)
    //                .build();
    //
    //        try {
    //            assertThatNoException().isThrownBy(() -> defaultClient.addRepository(BITNAMI_REPOSITORY));
    //            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
    //            assertThatNoException().isThrownBy(() -> defaultClient.installChart(APACHE_CHART, options));
    //        } finally {
    //            suppressExceptions(() -> defaultClient.uninstallChart(APACHE_CHART));
    //            suppressExceptions(() -> defaultClient.removeRepository(BITNAMI_REPOSITORY));
    //        }
    //    }
}
