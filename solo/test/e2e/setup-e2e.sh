#!/bin/bash
FST_CLUSTER_NAME=fst-local
FST_NAMESPACE=fst-local
kind delete cluster -n "${FST_CLUSTER_NAME}" || true
kind create cluster -n "${FST_CLUSTER_NAME}" || exit 1
kubectl create ns "${FST_NAMESPACE}" || exit 1
solo init -d ../charts --namespace "${FST_NAMESPACE}" || exit 1 # cache args for subsequent commands
solo cluster setup --cert-manager --cert-manager-crds --minio || exit 1
solo network deploy --no-enable-prometheus-svc-monitor --enable-hedera-explorer-tls || exit 1
