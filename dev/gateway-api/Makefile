# Force the use of bash as the shell for more features
SHELL=/bin/bash

SHELLOPTS:=$(if $(SHELLOPTS),$(SHELLOPTS):)pipefail:errexit
.ONESHELL:

SCRIPTS_DIR=$(PWD)/../scripts
GATEWAY_API_SCRIPT="gateway.sh"

.PHONY: deploy-gateway-api
deploy-gateway-api:
	#source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && deploy_haproxy_ingress
	source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && deploy_envoy_gateway_api

.PHONY: destroy-gateway-api
destroy-gateway-api:
	#source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && destroy_haproxy_ingress
	source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && destroy_envoy_gateway_api

.PHONY: deploy-fst-gateway
deploy-fst-gateway: deploy-gateway-api
	kubectl apply -f ./fst-gateway.yaml

.PHONY: destroy-fst-gateway
destroy-fst-gateway:
	kubectl delete -f fst-gateway.yaml

.PHONY: expose-envoy-gateway-svc
expose-envoy-gateway-svc:
	source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && expose_envoy_gateway_svc ${PORT} ${GATEWAY_PORT}

.PHONY: unexpose-envoy-gateway-svc
unexpose-envoy-gateway-svc:
	source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && unexpose_envoy_gateway_svc

.PHONY: test-gateway-http-route
test-gateway-http-route:
	source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && test_http_route

.PHONY: test-gateway-grpc-route
test-gateway-grpc-route:
	source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && test_grpc_route

.PHONY: test-gateway-tcp-route
test-gateway-tcp-route:
	source "${SCRIPTS_DIR}/${GATEWAY_API_SCRIPT}" && test_tcp_route
