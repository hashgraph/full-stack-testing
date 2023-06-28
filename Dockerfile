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
ENV COMPOSE_VERSION 2.16.0
ENV GO_VERSION 1.20.2

RUN dnf -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm && \
    /usr/bin/crb enable && \
    dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo && \
    dnf -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin && \
    dnf -y install md5deep jq zip unzip rsync gettext && \
    dnf -y install make gcc gcc-c++ openssl

RUN dnf -y install sudo && \
    echo >> /etc/sudoers && \
    echo "%hedera ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

RUN set -eux; \
        ARCH="$(uname -m)"; \
        case "${ARCH}" in \
          aarch64|arm64) \
            ESUM='78d632915bb75e9a6356a47a42625fd1a785c83a64a643fedd8f61e31b1b3bef'; \
            BINARY_URL='https://go.dev/dl/go1.20.2.linux-arm64.tar.gz'; \
          ;; \
          armhf|arm) \
            ESUM='d79d56bafd6b52b8d8cbe3f8e967caaac5383a23d7a4fa9ac0e89778cd16a076'; \
            BINARY_URL='https://go.dev/dl/go1.20.2.linux-armv6l.tar.gz'; \
          ;; \
          ppc64el|powerpc:common64) \
            ESUM='850564ddb760cb703db63bf20182dc4407abd2ff090a95fa66d6634d172fd095'; \
            BINARY_URL='https://go.dev/dl/go1.20.2.linux-ppc64le.tar.gz'; \
          ;; \
          s390x|s390:64-bit) \
            ESUM='8da24c5c4205fe8115f594237e5db7bcb1d23df67bc1fa9a999954b1976896e8'; \
            BINARY_URL='https://go.dev/dl/go1.20.2.linux-s390x.tar.gz'; \
          ;; \
          amd64|i386:x86-64|x86_64) \
            ESUM='4eaea32f59cde4dc635fbc42161031d13e1c780b87097f4b4234cfce671f1768'; \
            BINARY_URL='https://go.dev/dl/go1.20.2.linux-amd64.tar.gz'; \
          ;; \
          *) \
           echo "Unsupported arch: ${ARCH}"; \
           exit 1; \
           ;; \
        esac; \
    curl -LfsSo /tmp/golang.tar.gz ${BINARY_URL}; \
    echo "${ESUM} */tmp/golang.tar.gz" | sha256sum -c -; \
    mkdir -p /usr/local/go; \
    tar -C /usr/local/go -xzf /tmp/golang.tar.gz --strip-components=1; \
    rm /tmp/golang.tar.gz; \
    echo "export PATH=\"/usr/local/go/bin:\$PATH\"" >> /etc/profile.d/golang.sh; \
    echo "export CGO_ENABLED=1" >> /etc/profile.d/golang.sh; \
    echo "export PATH=\"\$HOME/go/bin:\$PATH\"" >> /etc/profile.d/golang.sh;

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

VOLUME "/staging"

# Set Final Working Directory and User
WORKDIR "/opt/hgcapp"
