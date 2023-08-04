package com.hedera.fullstack.base.api.test.resource;

import static org.assertj.core.api.Assertions.assertThat;

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
}
