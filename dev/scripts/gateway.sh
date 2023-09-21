#!/usr/bin/env bash

CUR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
source "${CUR_DIR}/env.sh"

GATEWAY_API_VERSION="${GATEWAY_API_VERSION:-v0.7.1}"

function deploy_haproxy_ingress() {
  deploy_gateway_api_crd

  echo ""
	echo "Deploying HAProxy Ingress Controller"
  echo "-----------------------------------------------------------------------------------------------------"
  local helm_chart=$(helm list --all-namespaces | grep haproxy-ingress)
  if [[ ! "${helm_chart}" ]]; then
    helm repo add haproxy-ingress https://haproxy-ingress.github.io/charts
    helm install haproxy-ingress haproxy-ingress/haproxy-ingress\
      --create-namespace --namespace haproxy-ingress \
      --version 0.14.4
  else
	  echo "HAProxy Ingress Controller is already installed"
	  echo ""
  fi
}

function destroy_haproxy_ingress() {
  echo ""
	echo "Uninstalling HAProxy Ingress Controller"
  echo "-----------------------------------------------------------------------------------------------------"
  get_gateway_status

  # Uninstall helm chart
  local helm_chart=$(helm list --all-namespaces | grep haproxy-ingress)
  if [[ "${helm_chart}" ]]; then
    helm uninstall haproxy-ingress -n haproxy-ingress
    kubectl delete ns haproxy-ingress
  fi

  uninstall_crd "gateway.networking.k8s.io"

	echo "HAProxy Ingress Controller is uninstalled"
	echo ""
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
  local crd_count=$(kubectl get crd | grep -c "gateway.networking.k8s.io")

  if [[ $crd_count -ne 7 ]]; then
    kubectl kustomize\
     "github.com/kubernetes-sigs/gateway-api/config/crd?ref=${GATEWAY_API_VERSION}" |\
     kubectl apply -f -
	else
	  echo "Gateway API CRD is already installed"
	  echo ""
	fi
}

function deploy_envoy_gateway_api() {
  echo ""
	echo "Installing Envoy Gateway API"
  echo "-----------------------------------------------------------------------------------------------------"
  local helm_chart=$(helm list --all-namespaces | grep envoy-gateway)
  if [[ ! "${helm_chart}" ]]; then
    helm install envoy-gateway oci://docker.io/envoyproxy/gateway-helm --version v0.0.0-latest -n envoy-gateway-system --create-namespace
    kubectl wait --timeout=5m -n envoy-gateway-system deployment/envoy-gateway --for=condition=Available
  else
    echo "Envoy Gateway API is already installed"
    echo ""
  fi

  get_gateway_status
}

function get_gateway_status() {
  echo ""
  helm list --all-namespaces | grep envoy-gateway
  echo "-----------------------Gateway CRDs------------------------------------------------------------------------------"
  kubectl get crd
  echo "-----------------------Gateway Class------------------------------------------------------------------------------"
  kubectl get gatewayclass
  echo "-----------------------Gateway------------------------------------------------------------------------------"
  kubectl get gateway
  echo "-----------------------HTTPRoute------------------------------------------------------------------------------"
  kubectl get httproute
  echo "-----------------------GRPCRoute------------------------------------------------------------------------------"
  kubectl get grpcroute
  echo "-----------------------TCPRoute------------------------------------------------------------------------------"
  kubectl get tcproute
}

function destroy_envoy_gateway_api() {
  echo ""
	echo "Uninstalling Envoy Gateway API"
  echo "-----------------------------------------------------------------------------------------------------"
  get_gateway_status

  # Uninstall helm chart
  local helm_chart=$(helm list --all-namespaces | grep envoy-gateway)
  if [[ "${helm_chart}" ]]; then
    helm uninstall envoy-gateway -n envoy-gateway-system
    kubectl delete ns envoy-gateway-system
    kubectl delete ns gateway-system
  fi

	echo "Envoy Gateway API is uninstalled"
	echo ""
}

function uninstall_crd() {
  local pattern="${1}"
  local crds=$(kubectl get crd | grep "${pattern}" | awk '{print $1 }')

  if [[ "${crds}" != "" ]]; then
    read -a installed -d '' -r <<< "${crds}" || true
    for name in "${installed[@]}"; do
      echo "Uninstalling CRD: $name"
      kubectl delete crd "${name}"
    done
	fi
}

function expose_envoy_gateway_svc() {
  local local_port="${1}"
  [[ -z "${local_port}" ]] && echo "ERROR: local port is required" && return 1

  local gateway_port="${2}"
  [[ -z "${gateway_port}" ]] && echo "ERROR: gateway port is required" && return 1

  unexpose_envoy_gateway_svc || true

  ENVOY_SERVICE=$(kubectl get svc -n envoy-gateway-system --selector=gateway.envoyproxy.io/owning-gateway-namespace="${NAMESPACE}",gateway.envoyproxy.io/owning-gateway-name=fst -o jsonpath="{.items[0].metadata.name}" )
  echo ""
	echo "Exposing Envoy Gateway Service: ${ENVOY_SERVICE} on ${local_port}:${gateway_port}"
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl port-forward "svc/${ENVOY_SERVICE}" -n envoy-gateway-system "${local_port}":"${gateway_port}" &
}

function unexpose_envoy_gateway_svc() {
  export GATEWAY_SVC_PID=$(ps aux | grep "kubectl port-forward svc/${ENVOY_SERVICE}" | grep -v "grep" | sed -n 1p | awk '{ print $2 }')
  [[ -z "${GATEWAY_SVC_PID}" ]] && echo "No Envoy Gateway Service PID is found" && return 0

  if [[ "${GATEWAY_SVC_PID}" ]]; then
    echo ""
    echo "Un-exposing Envoy Gateway Service: ${ENVOY_SERVICE} for PID: ${GATEWAY_SVC_PID}"
    echo "-----------------------------------------------------------------------------------------------------"
    kill "${GATEWAY_SVC_PID}" &>/dev/null || true
  fi
}

function test_http_route() {
  echo "Setup"
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl apply -f "${GATEWAY_API_DIR}/http-debug.yaml"
  kubectl wait --for=condition=Ready pods -l app=http-debug -n default

  local local_port=3100
  local gateway_port=3100 # needs to match the port specified at: $.Values.gatewayApi.gateway.listeners.httpDebug
  expose_envoy_gateway_svc ${local_port} ${gateway_port} || return 1

  local route_host="debug.fst.local"

  sleep 1

  echo "Checking ${route_host}"
  echo "-----------------------------------------------------------------------------------------------------"
  echo ""

  local status=$(curl --header "Host: ${route_host}" -o /dev/null -s -w "%{http_code}\n" localhost:${local_port})

  echo ""
  echo "********************************************************"
  if [[ $status -eq 200 ]]; then
    echo "SUCCESS: HTTPRoute ${route_host}:${gateway_port}"
  else
    curl --header "Host: ${route_host}" -vvv localhost:${local_port}
    echo ""
    echo "FAIL: HTTPRoute ${route_host}:${gateway_port}"
  fi
  echo "********************************************************"
  echo ""

  echo "Cleanup"
  echo "-----------------------------------------------------------------------------------------------------"
  unexpose_envoy_gateway_svc || true
  kubectl delete -f "${GATEWAY_API_DIR}/http-debug.yaml"
}

function test_grpc_route() {
  echo "Setup"
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl apply -f "${GATEWAY_API_DIR}/grpc-debug.yaml"
  kubectl wait --for=condition=Ready pods -l app=grpc-debug -n default

  local local_port=3101
  local gateway_port=3101 # needs to match the port specified at: $.Values.gatewayApi.gateway.listeners.tcpDebug
  expose_envoy_gateway_svc ${local_port} ${gateway_port} || return 1

  local route_host="debug.fst.local"

  sleep 1

  echo "Checking ${route_host}"
  echo "-----------------------------------------------------------------------------------------------------"
  echo ""

  grpcurl -plaintext -vv -authority=grpc-example.com 127.0.0.1:${local_port} yages.Echo/Ping
  local status=$?

  echo ""
  echo "********************************************************"
  if [[ $status -eq 0 ]]; then
    echo "SUCCESS: GRPCRoute ${route_host}:${gateway_port}"
  else
    echo "FAIL: GRPCRoute ${route_host}:${gateway_port}"
  fi
  echo "********************************************************"
  echo ""

  echo "Cleanup"
  echo "-----------------------------------------------------------------------------------------------------"
  unexpose_envoy_gateway_svc || true
  kubectl delete -f "${GATEWAY_API_DIR}/grpc-debug.yaml"
}

function test_tcp_route() {
  echo "Setup"
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl apply -f "${GATEWAY_API_DIR}/tcp-debug.yaml"
  kubectl wait --for=condition=Ready pods -l app=tcp-debug -n default

  local local_port=3101
  local gateway_port=3101 # needs to match the port specified at: $.Values.gatewayApi.gateway.listeners.tcpDebug
  expose_envoy_gateway_svc ${local_port} ${gateway_port} || return 1
  sleep 1

  echo ""
  echo "Checking TCP route localhost:${local_port}"
  echo "-----------------------------------------------------------------------------------------------------"
  echo ""

  timeout 1s bash -c "echo tcp-test | nc localhost ${local_port} >> deleteme.txt"
  echo ""
  echo "********************************************************"
  if [[ -s deleteme.txt ]]; then
    echo "SUCCESS: TCPRoute localhost:${local_port}"
  else
    echo "FAIL: TCPRoute localhost:${local_port}"
  fi
  echo "********************************************************"
  echo ""

  echo "Cleanup"
  echo "-----------------------------------------------------------------------------------------------------"
  rm deleteme.txt
  unexpose_envoy_gateway_svc || true
  kubectl delete -f "${GATEWAY_API_DIR}/tcp-debug.yaml"
}
