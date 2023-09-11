{{- define "fullstack.sidecars.otelCollector" -}}
{{- $otel := .otel | required "context must include 'otel'!" -}}
{{- $defaults := .defaults | required "context must include 'defaults'!" }}
{{- $chart := .chart | required "context must include 'chart'!" -}}
- name: {{ default "otel-collector" $otel.nameOverride }}
  image: {{ include "fullstack.container.image" (dict "image" $otel.image "Chart" $chart "defaults" $defaults) }}
  imagePullPolicy: {{ include "fullstack.images.pullPolicy" (dict "image" $otel.image "defaults" $defaults) }}
  securityContext:
    {{- include "fullstack.root.security.context" . | nindent 4 }}
  ports:
    - name: otlp # otel port defined in otel-collector config
      containerPort: 4317
      protocol: TCP
    - name: prometheus
      containerPort: 9090
      protocol: TCP
    - name: health # for otel-collector liveness check
      containerPort: 13133
      protocol: TCP
    - name: metrics # default metrics port exposed by the otel-collector itself
      containerPort: 8888
      protocol: TCP
  livenessProbe:
    httpGet:
      path: /
      port: health
  readinessProbe:
    httpGet:
      path: /
      port: health
  volumeMounts:
    - name: otel-collector-volume
      mountPath: /etc/otelcol-contrib/config.yaml
      subPath: config.yaml #key in the configmap
      readOnly: true
  {{- with default $defaults.resources $otel.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end -}}
