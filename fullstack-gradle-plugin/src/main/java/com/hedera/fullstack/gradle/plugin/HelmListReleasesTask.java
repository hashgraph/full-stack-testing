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

package com.hedera.fullstack.gradle.plugin;

import com.hedera.fullstack.helm.client.HelmClient;
import com.hedera.fullstack.helm.client.HelmClientBuilder;
import com.hedera.fullstack.helm.client.model.release.ReleaseItem;
import java.util.List;
import org.gradle.api.DefaultTask;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.Optional;
import org.gradle.api.tasks.TaskAction;
import org.gradle.api.tasks.options.Option;

public abstract class HelmReleaseExistsTask extends DefaultTask {
    @Input
    @Option(option = "release", description = "The release to verify exists")
    public abstract Property<String> getRelease();

    @Input
    @Optional
    @Option(option = "namespace", description = "The namespace to use when listing the releases")
    public abstract Property<String> getNamespace();

    @Input
    @Optional
    @Option(option = "allNamespaces", description = "True if we should list releases in all namespaces")
    public abstract Property<Boolean> getAllNamespaces();

    @TaskAction
    void releaseExists() {
        HelmClientBuilder helmClientBuilder = HelmClient.builder();
        if (getNamespace().isPresent()) {
            helmClientBuilder.defaultNamespace(getNamespace().get());
        }
        HelmClient helmClient = helmClientBuilder.build();
        try {
            List<ReleaseItem> releaseItems = helmClient.listReleases(getAllNamespaces().getOrElse(false));
        } catch (Exception e) {
            this.getProject()
                    .getLogger()
                    .error("HelmListReleasesTask.listReleases() An ERROR occurred while listing the releases: ", e);
            throw e;
        }
    }
}
