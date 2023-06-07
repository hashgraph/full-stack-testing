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

package com.hedera.fullstack.helm.client.test.model;

import static org.junit.jupiter.api.Assertions.*;

import com.hedera.fullstack.helm.client.model.install.InstallChartOptions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class InstallChartOptionsBuilderTest {

    @Test
    @DisplayName("Test InstallChartOptionsBuilder")
    void testInstallChartOptionsBuilder() {
        InstallChartOptions options = InstallChartOptions.builder()
                .atomic(true)
                .createNamespace(true)
                .dependencyUpdate(true)
                .description("description")
                .enableDNS(true)
                .force(true)
                .output("output")
                .passCredentials(true)
                .password("password")
                .repo("repo")
                .skipCredentials(true)
                .timeout("timeout")
                .username("username")
                .values("values")
                .verify(true)
                .version("version")
                .waitFor(true)
                .build();
        assertNotNull(options);
        assertTrue(options.atomic());
        assertTrue(options.createNamespace());
        assertTrue(options.dependencyUpdate());
        assertEquals("description", options.description());
        assertTrue(options.enableDNS());
        assertTrue(options.force());
        assertEquals("output", options.output());
        assertTrue(options.passCredentials());
        assertEquals("password", options.password());
        assertEquals("repo", options.repo());
        assertTrue(options.skipCredentials());
        assertEquals("timeout", options.timeout());
        assertEquals("username", options.username());
        assertEquals("values", options.values());
        assertTrue(options.verify());
        assertEquals("version", options.version());
        assertTrue(options.waitFor());
    }
}
