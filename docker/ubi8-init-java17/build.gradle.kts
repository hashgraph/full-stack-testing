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

plugins {
    id("com.palantir.docker") version "0.35.0"
}

var repo = "ghcr.io"
var registry = "hashgraph/full-stack-testing"
var containerName = "ubi8-init-java17"
var appVersion = project.version.toString()

docker {
    name = "${repo}/${registry}/${containerName}:${appVersion}"
    version = appVersion
    files("entrypoint.sh", "network-node.service")
    buildx(true)
    if (!System.getenv("CI").isNullOrEmpty()) {
        platform("linux/arm64", "linux/amd64")
        push(true)
    } else {
        load(true) // loads the image into the local docker daemon, doesn't support multi-platform
    }
}
