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

package com.hedera.fullstack.service.locator.test.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.hedera.fullstack.base.api.resource.ResourceLoader;
import com.hedera.fullstack.service.locator.api.ArtifactLoader;
import com.hedera.fullstack.service.locator.api.ServiceLocator;
import com.hedera.fullstack.service.locator.test.mock.MockSlf4jLocator;
import com.jcovalent.junit.logging.JCovalentLoggingSupport;
import com.jcovalent.junit.logging.LogEntryBuilder;
import com.jcovalent.junit.logging.LoggingOutput;
import com.jcovalent.junit.logging.assertj.LoggingOutputAssert;
import java.io.IOException;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.event.Level;
import org.slf4j.spi.SLF4JServiceProvider;

@DisplayName("Artifact Loader")
@JCovalentLoggingSupport
class ArtifactLoaderTest {

    private static final ResourceLoader<ArtifactLoaderTest> RESOURCE_LOADER =
            new ResourceLoader<>(ArtifactLoaderTest.class);

    private static Path JAR_PATH;

    @BeforeAll
    static void setup() throws IOException {
        JAR_PATH = RESOURCE_LOADER.loadDirectory("modules");
        assertThat(JAR_PATH).isNotNull();
    }

    @Test
    @DisplayName("Logback: Artifacts dynamically loaded successfully")
    void logbackDynamicLoading() {
        final ArtifactLoader artifactLoader = ArtifactLoader.from(JAR_PATH);
        assertThat(artifactLoader).isNotNull();
        assertThat(artifactLoader.classLoader()).isNotNull().isInstanceOf(URLClassLoader.class);
        assertThat(artifactLoader.moduleLayer()).isNotNull();
        assertThat(artifactLoader.classPath()).isNotEmpty();
        assertThat(artifactLoader.modulePath()).isNotEmpty();
    }

    @Test
    @DisplayName("Logback: Artifacts dynamically loaded can be used by Service Loader")
    void logbackDynamicServiceLoading() {
        final ArtifactLoader artifactLoader = ArtifactLoader.from(JAR_PATH);
        assertThat(artifactLoader).isNotNull();

        final ServiceLocator<SLF4JServiceProvider> serviceLocator = MockSlf4jLocator.create(artifactLoader);
        assertThat(serviceLocator).isNotNull();

        final SLF4JServiceProvider serviceProvider = serviceLocator.findFirst().orElseThrow();
        assertThat(serviceProvider)
                .isNotNull()
                .extracting(Object::getClass)
                .extracting(Class::getName)
                .isEqualTo("ch.qos.logback.classic.spi.LogbackServiceProvider");
    }

    @Test
    @DisplayName("Logback: Artifacts dynamically loaded with an empty directory")
    void logbackDynamicServiceLoadingEmptyDirectory(final LoggingOutput loggingOutput) {
        final ArtifactLoader artifactLoader = ArtifactLoader.from(Path.of("no-modules"));
        assertThat(artifactLoader).isNotNull();
        LoggingOutputAssert.assertThat(loggingOutput)
                .hasAtLeastOneEntry(List.of(
                        LogEntryBuilder.builder()
                                .level(Level.DEBUG)
                                .message("No module path entries found, skipping module layer creation")
                                .build()));
    }
}
