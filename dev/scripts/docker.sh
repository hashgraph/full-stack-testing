#!/usr/bin/env bash

CUR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
source "${CUR_DIR}/env.sh"
setup_kubectl_context

readonly KUBECTL_BATS_IMAGE="${LOCAL_DOCKER_REGISTRY}/kubectl-bats:${LOCAL_DOCKER_IMAGE_TAG}"

function build_kubectl_bats() {
  [[ -z "${CLUSTER_NAME}" ]] && echo "ERROR: [build_kubectl_bats] Cluster name is required" && return 1

  echo ""
  echo "Building kubectl-bats image"
  echo "-----------------------------------------------------------------------------------------------------"
  cd "${DOCKERFILE_DIR}/kubectl-bats" && docker build -t "${KUBECTL_BATS_IMAGE}" .
  kind load docker-image "${KUBECTL_BATS_IMAGE}" -n "${CLUSTER_NAME}"

  log_time "build_kubectl_bats"
}
