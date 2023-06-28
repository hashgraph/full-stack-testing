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

FROM registry.access.redhat.com/ubi8/ubi-init:latest
ENV COMPOSE_VERSION 2.19.0

RUN dnf -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm && \
    /usr/bin/crb enable && \
    dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo && \
    dnf -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin && \
    dnf -y install md5deep jq zip unzip rsync gettext

RUN dnf -y install sudo && \
    echo >> /etc/sudoers && \
    echo "%hedera ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

RUN systemctl enable docker && \
    systemctl enable containerd

# Install Docker Compose
RUN curl -SLo /usr/bin/docker-compose "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m)" && \
    chmod +x /usr/bin/docker-compose

# Configure the standard user account
RUN groupadd --gid 2000 hedera && \
    useradd --no-user-group --create-home --uid 2000 --gid 2000 --shell /bin/bash hedera && \
    usermod -aG docker hedera && \
    mkdir -p /opt/hgcapp && \
    chown -R hedera:hedera /opt/hgcapp

RUN touch /var/run/docker.sock && \
    chown root:docker /var/run/docker.sock

# Set Final Working Directory and User
WORKDIR "/opt/hgcapp"
