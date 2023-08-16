#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly SCRIPT_DIR

GATEWAY_API_VERSION="${GATEWAY_API_VERSION:-v0.7.1}"

function deploy_haproxy_ingress_controller() {
  helm repo add haproxy-ingress https://haproxy-ingress.github.io/charts
  helm install haproxy-ingress haproxy-ingress/haproxy-ingress\
    --create-namespace --namespace ingress-controller\
    --version 0.14.4\
    -f "${SCRIPT_DIR}/../../charts/hedera-network/templates/gateway-api/haproxy-ingress-values.yaml"
}

function deploy_gateway_api_crd() {
  kubectl kustomize\
   "github.com/kubernetes-sigs/gateway-api/config/crd?ref=${GATEWAY_API_VERSION}" |\
   kubectl apply -f -
}