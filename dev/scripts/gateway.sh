#!/usr/bin/env bash

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

#  uninstall_crd "gateway.networking.k8s.io"
#  uninstall_crd "gateway.envoyproxy.io"

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
  export ENVOY_SERVICE=$(kubectl get svc -n envoy-gateway-system --selector=gateway.envoyproxy.io/owning-gateway-namespace=default,gateway.envoyproxy.io/owning-gateway-name=fst -o jsonpath='{.items[0].metadata.name}')
  echo ""
	echo "Exposing Envoy Gateway Service: ${ENVOY_SERVICE} on port 8888"
  echo "-----------------------------------------------------------------------------------------------------"
  kubectl port-forward "svc/${ENVOY_SERVICE}"  -n envoy-gateway-system 8888:80 &
}

function unexpose_envoy_gateway_svc() {
  pid=$(ps aux | grep "kubectl port-forward svc/envoy-default-fst-a00b59fc -n envoy-gateway-system 8888:80" | sed -n 2p | awk '{ print $2 }')
  if [[ "${pid}" ]]; then
    echo ""
    echo "Un-exposing Envoy Gateway Service: ${ENVOY_SERVICE} on port 8888 for PID: ${pid}"
    echo "-----------------------------------------------------------------------------------------------------"
    kill -9 "${pid}"
  fi
}