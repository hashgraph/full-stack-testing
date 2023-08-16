#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly SCRIPT_DIR

GATEWAY_API_VERSION="${GATEWAY_API_VERSION:-v0.7.1}"

function deploy_haproxy_ingress_controller() {
  echo ""
	echo "Deploying HAProxy Ingress Controller"
  echo "-----------------------------------------------------------------------------------------------------"
  local count=$(kubectl --namespace ingress-controller get services haproxy-ingress | grep 'haproxy-ingress' | wc -l)

  if [[ $count -eq 0 ]]; then
    helm repo add haproxy-ingress https://haproxy-ingress.github.io/charts
    helm install haproxy-ingress haproxy-ingress/haproxy-ingress\
      --create-namespace --namespace ingress-controller\
      --version 0.14.4
  else
	  echo "HAProxy Ingress Controller is already installed"
	  echo ""
  fi
}

function deploy_gateway_api_crd() {
  echo ""
	echo "Deploying Gateway API CRD"
  echo "-----------------------------------------------------------------------------------------------------"
  #  Expected list of CRDs
  #  -------------------------
  #  gatewayclasses.gateway.networking.k8s.io
  #  gateways.gateway.networking.k8s.io
  #  httproutes.gateway.networking.k8s.io
  #  referencepolicies.gateway.networking.k8s.io
  #  tcproutes.gateway.networking.k8s.io
  #  tlsroutes.gateway.networking.k8s.io
  #  udproutes.gateway.networking.k8s.io
  local crd_count=$(kubectl get crd | grep "gateway.networking.k8s.io" | wc -l)

  if [[ $crd_count -ne 7 ]]; then
    kubectl kustomize\
     "github.com/kubernetes-sigs/gateway-api/config/crd?ref=${GATEWAY_API_VERSION}" |\
     kubectl apply -f -
	else
	  echo "Gateway API CRD is already installed"
	  echo ""
	fi
}