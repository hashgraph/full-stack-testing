#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly SCRIPT_DIR
readonly DOCKERFILE_DIR="${SCRIPT_DIR}/../../docker"
readonly LOCAL_DOCKER_REGISTRY="docker.fst.local" # same as in dev/ci/ci-values.yaml
readonly LOCAL_DOCKER_IMAGE_TAG="local"
readonly KUBECTL_BATS_IMAGE="${LOCAL_DOCKER_REGISTRY}/kubectl-bats:${LOCAL_DOCKER_IMAGE_TAG}"
readonly FST_CLUSTER_NAME="fst"

function build_kubectl_bats() {
  echo ""
	echo "Building kubectl-bats image"
  echo "-----------------------------------------------------------------------------------------------------"
	cd "${DOCKERFILE_DIR}/kubectl-bats" && docker build -t "${KUBECTL_BATS_IMAGE}" .
}

function load_kubectl_bats_image() {
  echo ""
	echo "Loading kubectl-bats image into local kind cluster"
  echo "-----------------------------------------------------------------------------------------------------"
  kind load docker-image ${KUBECTL_BATS_IMAGE} -n "${FST_CLUSTER_NAME}"
}