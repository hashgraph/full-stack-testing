#!/bin/bash
SOLO_CLUSTER_NAME=solo-local
SOLO_NAMESPACE=solo-local
kind delete cluster -n "${SOLO_CLUSTER_NAME}" || true
kind create cluster -n "${SOLO_CLUSTER_NAME}" || exit 1
kubectl create ns "${SOLO_NAMESPACE}" || exit 1
solo init -d ../charts --namespace "${SOLO_NAMESPACE}" || exit 1 # cache args for subsequent commands
solo cluster setup --cert-manager --cert-manager-crds --minio || exit 1
solo network deploy --no-enable-prometheus-svc-monitor --enable-hedera-explorer-tls || exit 1
