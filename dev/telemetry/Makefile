# Force the use of bash as the shell for more features
SHELL=/bin/bash

# Ensure we can catch error to run cleanup when multiple make commands are run in sequence.
# Here we tell make to run all scripts as one-shell and also set 'pipefail' and 'errexit' flags.
# https://stackoverflow.com/questions/28597794/how-can-i-clean-up-after-an-error-in-a-makefile
SHELLOPTS:=$(if $(SHELLOPTS),$(SHELLOPTS):)pipefail:errexit
.ONESHELL:

SCRIPTS_DIR=$(PWD)/../scripts
TELEMETRY_SCRIPT="telemetry.sh"

.PHONY: fetch-prometheus-operator-bundle
fetch-prometheus-operator-bundle:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && fetch-prometheus-operator-bundle

.PHONY: deploy-prometheus-operator
deploy-prometheus-operator: fetch-prometheus-operator-bundle
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy-prometheus-operator

.PHONY: destroy-prometheus-operator
destroy-prometheus-operator:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && destroy-prometheus-operator

.PHONY: deploy-grafana-tempo
deploy-grafana-tempo:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy_grafana_tempo && expose_grafana

.PHONY: destroy-grafana-tempo
destroy-grafana-tempo:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && unexpose_grafana && destroy_grafana_tempo

.PHONY: deploy-prometheus
deploy-prometheus: deploy-prometheus-operator
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy-prometheus && expose_prometheus

.PHONY: destroy-prometheus
destroy-prometheus:
	-source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && unexpose_prometheus && destroy-prometheus
	make destroy-prometheus-operator

.PHONY: deploy-telemetry-stack
deploy-telemetry-stack: deploy-prometheus deploy-grafana-tempo

.PHONY: destroy-telemetry-stack
destroy-telemetry-stack: destroy-prometheus destroy-grafana-tempo

# Prometheus example app
.PHONY: deploy-prometheus-example-app
deploy-prometheus-example-app:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy-prometheus-example-app

.PHONY: destroy-prometheus-example-app
destroy-prometheus-example-app:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && destroy-prometheus-example-app

.PHONY: deploy-grafana-tempo
deploy-grafana-tempo:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy_grafana_tempo && expose_grafana

.PHONY: destroy-grafana-tempo
destroy-grafana-tempo:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && unexpose_grafana && destroy_grafana_tempo

# Tracing example app
.PHONY: deploy-tracing-example-app
deploy-tracing-example-app:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy_tracing_example_app

.PHONY: destroy-tracing-example-app
destroy-tracing-example-app:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && destroy_tracing_example_app

.PHONY: deploy-all
deploy-all: deploy-telemetry-stack deploy-prometheus-example-app deploy-tracing-example-app

.PHONY: destroy-all
destroy-all:
	# Note: - prefix ensures errors are ignored and continues
	-${MAKE} destroy-telemetry-stack
	-${MAKE} destroy-prometheus-example-app
	-${MAKE} destroy-tracing-example-app

