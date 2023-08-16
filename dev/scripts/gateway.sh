#!/usr/bin/env bash

GATEWAY_API_VERSION="${GATEWAY_API_VERSION:-v0.7.1}"

function deploy_gateway_api_crd() {
  kubectl kustomize\
   "github.com/kubernetes-sigs/gateway-api/config/crd?ref=${GATEWAY_API_VERSION}" |\
   kubectl apply -f -
}