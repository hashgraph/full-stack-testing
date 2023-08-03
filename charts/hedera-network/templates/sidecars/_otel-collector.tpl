{{- define "sidecars.otel-collector" -}}
{{- $otel := .otel | required "context must include 'otel'!" -}}
{{- $chart := .chart | required "context must include 'chart'!" -}}
- name: {{ $otel.nameOverride | default "otel-collector" }}
  image: {{ include "container.image" (dict "image" $otel.image "Chart" $chart) }}
  imagePullPolicy: {{ include "images.pullPolicy" $otel.image }}
  securityContext:
    {{- include "root.security.context" . | nindent 4 }}
  ports:
    - name: healthcheck
      containerPort: 13133
      protocol: TCP
    - name: metrics
      containerPort: 8888
      protocol: TCP
    - name: otlp
      containerPort: 4317
      protocol: TCP
  livenessProbe:
    httpGet:
      path: /
      port: healthcheck
  readinessProbe:
    httpGet:
      path: /
      port: healthcheck
  volumeMounts:
    - name: otel-collector-volume
      mountPath: /etc/otel-collector-config.yaml
      subPath: config.yaml #key in the configmap
      readOnly: true
  {{- with $otel.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end -}}
