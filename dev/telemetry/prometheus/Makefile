# Force the use of bash as the shell for more features
SHELL=/bin/bash

# Ensure we can catch error to run cleanup when multiple make commands are run in sequence.
# Here we tell make to run all scripts as one-shell and also set 'pipefail' and 'errexit' flags.
# https://stackoverflow.com/questions/28597794/how-can-i-clean-up-after-an-error-in-a-makefile
SHELLOPTS:=$(if $(SHELLOPTS),$(SHELLOPTS):)pipefail:errexit
.ONESHELL:

# Run the below command to retrieve the latest version
# curl -s "https://api.github.com/repos/prometheus-operator/prometheus-operator/releases/latest" | jq -cr .tag_name
PROMETHEUS_VERSION=v0.67.1

SCRIPTS_DIR=$(PWD)/../../scripts
TELEMETRY_SCRIPT="telemetry.sh"

.SILENT: fetch-operator-bundle

.PHONY: fetch-operator-bundle
fetch-operator-bundle:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && fetch-prometheus-operator-bundle


.PHONY: deploy-prometheus-operator
deploy-prometheus-operator: fetch-operator-bundle
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy-prometheus-operator

.PHONY: destroy-prometheus-operator
destroy-prometheus-operator:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && destroy-prometheus-operator

.PHONY: deploy-prometheus
deploy-prometheus:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy-prometheus

.PHONY: destroy-prometheus
destroy-prometheus:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && destroy-prometheus

.PHONY: destroy-all
destroy-all:
	# Note: - prefix ensures errors are ignored and continues
	-${MAKE} destroy-prometheus-example-app
	-${MAKE} destroy-prometheus
	-${MAKE} destroy-prometheus-operator

.PHONY: deploy-all
deploy-all: deploy-prometheus-operator deploy-prometheus-example-app deploy-prometheus

# Prometheus example app
.PHONY: deploy-prometheus-example-app
deploy-prometheus-example-app:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && deploy-prometheus-example-app

.PHONY: destroy-prometheus-example-app
destroy-prometheus-example-app:
	source "${SCRIPTS_DIR}/${TELEMETRY_SCRIPT}" && destroy-prometheus-example-app


