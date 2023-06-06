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

package com.hedera.fullstack.helm.client.model;

public final class InstallChartOptionsBuilder {
    private boolean atomic;
    private boolean createNamespace;
    private boolean dependencyUpdate;
    private String description;
    private boolean enableDNS;
    private boolean force;
    private String output;
    private boolean passCredentials;
    private String password;
    private String repo;
    private boolean skipCredentials;
    private Integer timeout;
    private String username;
    private String values;
    private boolean verify;
    private String version;
    private boolean waitFor;

    private InstallChartOptionsBuilder() {}

    public static InstallChartOptionsBuilder builder() {
        return new InstallChartOptionsBuilder();
    }

    public InstallChartOptionsBuilder atomic(boolean atomic) {
        this.atomic = atomic;
        return this;
    }

    public InstallChartOptionsBuilder createNamespace(boolean createNamespace) {
        this.createNamespace = createNamespace;
        return this;
    }

    public InstallChartOptionsBuilder dependencyUpdate(boolean dependencyUpdate) {
        this.dependencyUpdate = dependencyUpdate;
        return this;
    }

    public InstallChartOptionsBuilder description(String description) {
        this.description = description;
        return this;
    }

    public InstallChartOptionsBuilder enableDNS(boolean enableDNS) {
        this.enableDNS = enableDNS;
        return this;
    }

    public InstallChartOptionsBuilder force(boolean force) {
        this.force = force;
        return this;
    }

    public InstallChartOptionsBuilder output(String output) {
        this.output = output;
        return this;
    }

    public InstallChartOptionsBuilder passCredentials(boolean passCredentials) {
        this.passCredentials = passCredentials;
        return this;
    }

    public InstallChartOptionsBuilder password(String password) {
        this.password = password;
        return this;
    }

    public InstallChartOptionsBuilder repo(String repo) {
        this.repo = repo;
        return this;
    }

    public InstallChartOptionsBuilder skipCredentials(boolean skipCredentials) {
        this.skipCredentials = skipCredentials;
        return this;
    }

    public InstallChartOptionsBuilder timeout(Integer timeout) {
        this.timeout = timeout;
        return this;
    }

    public InstallChartOptionsBuilder username(String username) {
        this.username = username;
        return this;
    }

    public InstallChartOptionsBuilder values(String values) {
        this.values = values;
        return this;
    }

    public InstallChartOptionsBuilder verify(boolean verify) {
        this.verify = verify;
        return this;
    }

    public InstallChartOptionsBuilder version(String version) {
        this.version = version;
        return this;
    }

    public InstallChartOptionsBuilder waitFor(boolean waitFor) {
        this.waitFor = waitFor;
        return this;
    }

    public InstallChartOptions build() {
        return new InstallChartOptions(
                atomic,
                createNamespace,
                dependencyUpdate,
                description,
                enableDNS,
                force,
                output,
                passCredentials,
                password,
                repo,
                skipCredentials,
                timeout,
                username,
                values,
                verify,
                version,
                waitFor);
    }
}
