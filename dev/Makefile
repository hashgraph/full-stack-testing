SCRIPTS_DIR=$(PWD)/scripts

.PHONY: setup
setup:
	cp "${SCRIPTS_DIR}/template.env" "${SCRIPTS_DIR}/.env"

.PHONY: setup-cluster
setup-cluster:
	kind create cluster -n fst

.PHONY: deploy-chart
deploy-chart:
	@echo ">> Deploying helm chart..." && \
	helm install fst ../charts/hedera-network && \
 	echo ">> Waiting for network to be ready (timeout=300s)..." && \
  	kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l type=network-node --timeout=300s && \
 	echo ">> Running helm test..." && \
 	helm test fst &> deploy.log &

.PHONY: helm-test-logs
helm-test-logs:
	@kubectl wait --for=jsonpath='{.status.phase}'=Running pod/network-test --timeout=300s && \
	kubectl logs -f network-test

.PHONY: deploy
deploy: deploy-chart helm-test-logs

.PHONY: destroy
destroy:
	@echo ">> Uninstalling helm chart..." && helm uninstall fst && sleep 10

.PHONY: start
start:
	source "${SCRIPTS_DIR}/start-node-nmt.sh" && start_nodes

.PHONY: stop
stop:
	source "${SCRIPTS_DIR}/start-node-nmt.sh" && stop_nodes

.PHONY: gen-keys
gen-keys:
	"${SCRIPTS_DIR}./demo-keys/gen-public-pfx.sh"  node0 node1 node2 node3