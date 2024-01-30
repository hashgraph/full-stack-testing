#!/bin/bash
FST_CLUSTER_NAME=fst-local
FST_NAMESPACE=fst-local
kind delete cluster -n "${FST_CLUSTER_NAME}" || true
kind create cluster -n "${FST_CLUSTER_NAME}" || exit 1
kubectl create ns "${FST_NAMESPACE}" || exit 1
fsnetman init -d ../charts --namespace "${FST_NAMESPACE}" || exit 1 # cache args for subsequent commands
fsnetman cluster setup  || exit 1
fsnetman network deploy || exit 1
