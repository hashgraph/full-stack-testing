#!/usr/bin/env bash

echo "-----------------------------------------------------------------------------------------------------"
echo "Setting up environment variables"
echo "SCRIPT_NAME: ${SCRIPT_NAME}"

CUR_DIR="scripts"

source "${CUR_DIR}/env.sh"


CHART_VALUES_FILES=ci/ci-values.yaml
SCRIPTS_DIR=scripts

echo "-----------------------------------------------------------------------------------------------------"
echo "Creating cluster and namespace"
kind create cluster -n "${CLUSTER_NAME}" --config=dev-cluster.yaml

kubectl create ns "${NAMESPACE}"
kubectl get ns
kubectl config use-context "kind-${CLUSTER_NAME}"
kubectl config set-context --current --namespace="${NAMESPACE}"
kubectl config get-contexts

echo "-----------------------------------------------------------------------------------------------------"
echo "Building kubectl-bats image"
KUBECTL_BATS_IMAGE="${LOCAL_DOCKER_REGISTRY}/kubectl-bats:${LOCAL_DOCKER_IMAGE_TAG}"
cd "${DOCKERFILE_DIR}/kubectl-bats" && docker build -t "${KUBECTL_BATS_IMAGE}" .
kind load docker-image "${KUBECTL_BATS_IMAGE}" -n "${CLUSTER_NAME}"
cd -


echo "-----------------------------------------------------------------------------------------------------"
echo "Helm dependency update"

echo "cloud:" > "${CLUSTER_SETUP_VALUES_FILE}"
echo "  prometheusStack:" >> "${CLUSTER_SETUP_VALUES_FILE}"; \
echo "    enabled: true" >> "${CLUSTER_SETUP_VALUES_FILE}";
echo "  minio:" >> "${CLUSTER_SETUP_VALUES_FILE}"; \
echo "    enabled: true" >> "${CLUSTER_SETUP_VALUES_FILE}";

helm dependency update ../../../charts/fullstack-deployment
helm dependency update ../../../charts/fullstack-cluster-setup

echo "-----------------------------------------------------------------------------------------------------"
echo "Helm cluster setup"

helm install -n "${NAMESPACE}" "fullstack-cluster-setup" "${SETUP_CHART_DIR}" --values "${CLUSTER_SETUP_VALUES_FILE}"
echo "-----------------------Shared Resources------------------------------------------------------------------------------"
kubectl get clusterrole "${POD_MONITOR_ROLE}" -o wide


echo ""
echo "Installing helm chart... "
echo "SCRIPT_NAME: ${SCRIPT_NAME}"
echo "Additional values: ${CHART_VALUES_FILES}"
echo "-----------------------------------------------------------------------------------------------------"
if [ "${SCRIPT_NAME}" = "nmt-install.sh" ]; then
if [[ -z "${CHART_VALUES_FILES}" ]]; then
  helm install "${RELEASE_NAME}" -n "${NAMESPACE}" "${CHART_DIR}" --set defaults.root.image.repository=hashgraph/full-stack-testing/ubi8-init-dind
else
  helm install "${RELEASE_NAME}" -n "${NAMESPACE}"  "${CHART_DIR}" -f "${CHART_DIR}/values.yaml" --values "${CHART_VALUES_FILES}" --set defaults.root.image.repository=hashgraph/full-stack-testing/ubi8-init-dind
fi
else
if [[ -z "${CHART_VALUES_FILES}" ]]; then
  helm install "${RELEASE_NAME}" -n "${NAMESPACE}" "${CHART_DIR}"
else
  helm install "${RELEASE_NAME}" -n "${NAMESPACE}" "${CHART_DIR}" -f "${CHART_DIR}/values.yaml" --values "${CHART_VALUES_FILES}"
fi
fi

echo "-----------------------------------------------------------------------------------------------------"
echo "Get service and pod information"

kubectl get svc -o wide && \
kubectl get pods -o wide && \

echo "Waiting for network-node pods to be phase=running (first deployment takes ~10m)...."
kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l fullstack.hedera.com/type=network-node --timeout=900s

echo "Waiting for network-node pods to be condition=ready (first deployment takes ~10m)...."
kubectl wait --for=condition=ready pod -l fullstack.hedera.com/type=network-node --timeout=900s

echo "Service Information...."
kubectl get svc -o wide

echo "Waiting for pods to be up (timeout 600s)"
kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l fullstack.hedera.com/type=network-node --timeout=600s


echo "Running helm chart tests (takes ~5m, timeout 15m)... "
echo "-----------------------------------------------------------------------------------------------------"
sleep 10
helm test "${RELEASE_NAME}" --filter name=network-test --timeout 15m
kubectl logs network-test

echo "-----------------------------------------------------------------------------------------------------"
echo "Setup and start nodes"
if [ "${SCRIPT_NAME}" = "nmt-install.sh" ]; then
  echo "Ignore error from nmt install due to error of removing symlink"
  source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && setup_node_all || true
  source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && start_node_all || true
else
  source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && setup_node_all
  source "${SCRIPTS_DIR}/${SCRIPT_NAME}" && start_node_all
fi

echo "-----------------------------------------------------------------------------------------------------"
echo "Tear down cluster"

kubectl delete pod network-test -n "${NAMESPACE}" || true

echo "Uninstalling helm chart ${RELEASE_NAME} in namespace ${NAMESPACE}... "
echo "-----------------------------------------------------------------------------------------------------"
helm uninstall -n "${NAMESPACE}" "${RELEASE_NAME}"
sleep 10
echo "Uninstalled helm chart ${RELEASE_NAME} in namespace ${NAMESPACE}"

echo "Removing postgres pvc"
has_postgres_pvc=$(kubectl get pvc --no-headers -l app.kubernetes.io/component=postgresql,app.kubernetes.io/name=postgres,app.kubernetes.io/instance="${RELEASE_NAME}" | wc -l)
if [[ $has_postgres_pvc ]]; then
kubectl delete pvc -l app.kubernetes.io/component=postgresql,app.kubernetes.io/name=postgres,app.kubernetes.io/instance="${RELEASE_NAME}"
fi

echo "Workflow finished successfully"
echo "-----------------------------------------------------------------------------------------------------"
