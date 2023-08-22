#!/usr/bin/env bash

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
}

function get_gateway_status() {
  echo ""
  helm list --all-namespaces | grep envoy-gateway
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl get crd
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl get gatewayclass
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl get gateway
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl get httproute
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl get grpcroute
  echo "-----------------------------------------------------------------------------------------------------"
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
  fi

  uninstall_crd "gateway.networking.k8s.io"
  uninstall_crd "gateway.envoyproxy.io"

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
  ENVOY_SERVICE=$(kubectl get svc -n envoy-gateway-system --selector=gateway.envoyproxy.io/owning-gateway-namespace=default,gateway.envoyproxy.io/owning-gateway-name=fst -o jsonpath="{.items[0].metadata.name}" )
  echo ""
	echo "Exposing Envoy Gateway Service: ${ENVOY_SERVICE} on port 8888"
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl port-forward "svc/${ENVOY_SERVICE}"  -n envoy-gateway-system 8888:80 &
  export GATEWAY_SVC_PID=$(ps aux | grep "kubectl port-forward svc/envoy-default-fst-a00b59fc -n envoy-gateway-system 8888:80" | sed -n 2p | awk '{ print $2 }')
  echo "PID: ${GATEWAY_SVC_PID}"
}

function unexpose_envoy_gateway_svc() {
  if [[ "${GATEWAY_SVC_PID}" ]]; then
    echo ""
    echo "Un-exposing Envoy Gateway Service: ${ENVOY_SERVICE} on port 8888 for PID: ${GATEWAY_SVC_PID}"
    echo "-----------------------------------------------------------------------------------------------------"
    kill "${GATEWAY_SVC_PID}" || true
  fi
}

function test_http_route() {
  expose_envoy_gateway_svc

  local route_host="debug.fst.local"

  sleep 1

  echo "Checking ${route_host}"
  echo "-----------------------------------------------------------------------------------------------------"
  echo ""

  local status=$(curl --header "Host: ${route_host}" -o /dev/null -s -w "%{http_code}\n" localhost:8888)

  if [[ $status -eq 200 ]]; then
    echo "SUCCESS: HTTPRoute ${route_host}"
  else
    echo "FAIL: HTTPRoute ${route_host}"
  fi

  unexpose_envoy_gateway_svc || true
}

function test_grpc_route() {
  expose_envoy_gateway_svc

  local route_host="debug.fst.local"

  sleep 1

  echo "Checking ${route_host}"
  echo "-----------------------------------------------------------------------------------------------------"
  echo ""

  grpcurl -plaintext -vv -authority=grpc-example.com 127.0.0.1:8888 yages.Echo/Ping
  local status=$?

  if [[ $status -eq 0 ]]; then
    echo "SUCCESS: GRPCRoute ${route_host}"
  else
    echo "FAIL: GRPCRoute ${route_host}"
  fi

  unexpose_envoy_gateway_svc
}
