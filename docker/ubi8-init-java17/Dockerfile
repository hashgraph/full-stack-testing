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
# Define Standard Environment Variables
ENV LC_ALL=C.UTF-8
ENV COMPOSE_VERSION 2.19.0

# Define JDK Environment Variables
ENV JAVA_VERSION jdk-17.0.7+7
ENV JAVA_HOME /opt/java/openjdk
ENV PATH $JAVA_HOME/bin:$PATH

# Define Application Environment Variables
ENV APP_HOME="/opt/hgcapp/services-hedera/HapiApp2.0"
ENV JAVA_HEAP_MIN=""
ENV JAVA_HEAP_MAX=""
ENV JAVA_OPTS=""

RUN dnf -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm && \
    /usr/bin/crb enable && \
    dnf -y install binutils libsodium openssl zlib readline tzdata gzip tar ca-certificates curl && \
    dnf clean all

# Install Java 17 Adoptium JDK
RUN set -eux; \
    ARCH="$(objdump="$(command -v objdump)" && objdump --file-headers "$objdump" | awk -F '[:,]+[[:space:]]+' '$1 == "architecture" { print $2 }')"; \
    case "${ARCH}" in \
       aarch64|arm64) \
         ESUM='0084272404b89442871e0a1f112779844090532978ad4d4191b8d03fc6adfade'; \
         BINARY_URL='https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.7%2B7/OpenJDK17U-jdk_aarch64_linux_hotspot_17.0.7_7.tar.gz'; \
         ;; \
       ppc64el|powerpc:common64) \
         ESUM='8f4366ff1eddb548b1744cd82a1a56ceee60abebbcbad446bfb3ead7ac0f0f85'; \
         BINARY_URL='https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.7%2B7/OpenJDK17U-jdk_ppc64le_linux_hotspot_17.0.7_7.tar.gz'; \
         ;; \
       s390x|s390:64-bit) \
         ESUM='2d75540ae922d0c4162729267a8c741e2414881a468fd2ce4140b4069ba47ca9'; \
         BINARY_URL='https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.7%2B7/OpenJDK17U-jdk_s390x_linux_hotspot_17.0.7_7.tar.gz'; \
         ;; \
       amd64|i386:x86-64) \
         ESUM='e9458b38e97358850902c2936a1bb5f35f6cffc59da9fcd28c63eab8dbbfbc3b'; \
         BINARY_URL='https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.7%2B7/OpenJDK17U-jdk_x64_linux_hotspot_17.0.7_7.tar.gz'; \
         ;; \
       *) \
         echo "Unsupported arch: ${ARCH}"; \
         exit 1; \
         ;; \
    esac; \
	  curl -sSLo /tmp/openjdk.tar.gz ${BINARY_URL}; \
	  echo "${ESUM} */tmp/openjdk.tar.gz" | sha256sum -c -; \
	  mkdir -p "$JAVA_HOME"; \
	  tar --extract \
	      --file /tmp/openjdk.tar.gz \
	      --directory "$JAVA_HOME" \
	      --strip-components 1 \
	      --no-same-owner \
	  ; \
    rm -f /tmp/openjdk.tar.gz ${JAVA_HOME}/lib/src.zip;

RUN dnf -y install sudo && \
    echo >> /etc/sudoers && \
    echo "%hedera ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Configure the standard user account
RUN groupadd --gid 2000 hedera && \
    useradd --no-user-group --create-home --uid 2000 --gid 2000 --shell /bin/bash hedera && \
    mkdir -p /opt/hgcapp && \
    chown -R hedera:hedera /opt/hgcapp

# Create Application Folders
RUN mkdir -p "/opt/hgcapp" && \
    mkdir -p "/opt/hgcapp/accountBalances" && \
    mkdir -p "/opt/hgcapp/eventsStreams" && \
    mkdir -p "/opt/hgcapp/recordStreams" && \
    mkdir -p "/opt/hgcapp/services-hedera" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/apps" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/config" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/keys" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/lib" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/stats" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/saved" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/upgrade"

# Add the entrypoint script and systemd service file
ADD entrypoint.sh /opt/hgcapp/services-hedera/HapiApp2.0/
ADD network-node.service /usr/lib/systemd/system/

# Ensure proper file permissions
RUN chmod -R +x /opt/hgcapp/services-hedera/HapiApp2.0/entrypoint.sh && \
    chown -R 2000:2000 /opt/hgcapp/

RUN mkdir -p /etc/network-node && \
    touch /etc/network-node/application.env && \
    chown -R 2000:2000 /etc/network-node

# Expose TCP/UDP Port Definitions
EXPOSE 50111/tcp 50211/tcp 50212/tcp

# Set Final Working Directory and User
WORKDIR "/opt/hgcapp"
