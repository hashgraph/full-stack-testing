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

package com.hedera.fullstack.base.api.test.resource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.hedera.fullstack.base.api.resource.ResourceLoader;
import java.io.IOException;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class ResourceLoaderTest {
    @Test
    @DisplayName("Verify load works as expected")
    void testLoad() throws IOException {
        ResourceLoader<ResourceLoaderTest> resourceLoader = new ResourceLoader<>(ResourceLoaderTest.class);
        Path resourcePath = resourceLoader.load("resource.txt");
        assertThat(resourcePath)
                .exists()
                .isRegularFile()
                .hasFileName("resource.txt")
                .isWritable()
                .isReadable()
                .isExecutable();
    }

    @Test
    @DisplayName("Verify load fails when called with a non-existent file")
    void testLoadIOException() {
        ResourceLoader<ResourceLoaderTest> resourceLoader = new ResourceLoader<>(ResourceLoaderTest.class);
        assertThatThrownBy(() -> resourceLoader.load("not-resource.txt")).isInstanceOf(IOException.class);
    }
}
