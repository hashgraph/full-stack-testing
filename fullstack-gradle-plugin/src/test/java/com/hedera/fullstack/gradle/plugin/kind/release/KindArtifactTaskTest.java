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

package com.hedera.fullstack.gradle.plugin.kind.release;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;
import java.nio.file.Path;
import org.gradle.api.Project;
import org.gradle.api.file.Directory;
import org.gradle.testfixtures.ProjectBuilder;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class KindArtifactTaskTest {
    static final String OS = System.getProperty("os.name").toLowerCase();
    static final String BIT = System.getProperty("os.arch").toLowerCase();

    private static Project project;

    @BeforeAll
    static void beforeAll() {
        project = ProjectBuilder.builder().build();
        project.getPlugins().apply("java");
    }

    private static boolean isWindows() {
        return (OS.contains("win"));
    }

    private static boolean isMac() {
        return (OS.contains("mac"));
    }

    private static boolean isLinux() {
        return (OS.contains("linux"));
    }

    private static boolean isArm64() {
        return (BIT.contains("arm64") || BIT.contains("aarch64"));
    }

    private static boolean isAmd64() {
        return (BIT.contains("amd64") || BIT.contains("x86_64"));
    }

    private static String getOs() {
        if (isWindows()) {
            return "windows";
        } else if (isMac()) {
            return "darwin";
        } else if (isLinux()) {
            return "linux";
        } else {
            return "unknown";
        }
    }

    private static String getArchitecture() {
        if (isArm64()) {
            return "arm64";
        } else if (isAmd64()) {
            return "amd64";
        } else {
            return "unknown";
        }
    }

    @Test
    @DisplayName("Test kind artifact download")
    void testKindArtifactDownload() {
        KindArtifactTask kindArtifactTask = project.getTasks()
                .create("kindArtifactDownloadTask", KindArtifactTask.class, task -> {
                    task.getVersion().set("0.20.0");
                });
        kindArtifactTask.execute();
        Directory directory = kindArtifactTask.getOutput().get();
        File kindExecutable = Path.of(directory.getAsFile().getAbsolutePath())
                .resolve(getOs())
                .resolve(getArchitecture())
                .resolve("kind" + (isWindows() ? ".exe" : ""))
                .toFile();
        assertThat(kindExecutable).exists();
    }
}
