#
# Copyright (C) 2023 Hedera Hashgraph, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

FROM bitnami/kubectl:latest

ENV BATS_HOME=/bats

# switch to user root for setup
USER root

# setup bats
RUN apt-get update && \
    apt-get install -y curl git vim python3 python3-pip jq && \
    git clone https://github.com/bats-core/bats-core.git "${BATS_HOME}"/bats-core && \
    git clone https://github.com/bats-core/bats-support.git "${BATS_HOME}"/test_helper/bats-support && \
    git clone https://github.com/bats-core/bats-assert.git "${BATS_HOME}"/test_helper/bats-assert && \
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash && \
    curl -L https://github.com/mikefarah/yq/releases/download/v4.34.2/yq_linux_amd64 -o /usr/bin/yq && \
    chmod +x /usr/bin/yq

#switch back to user 1001
USER 1001
