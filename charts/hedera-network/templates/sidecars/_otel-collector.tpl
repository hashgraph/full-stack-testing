{{- define "fullstack.sidecars.otelCollector" -}}
{{- $otel := .otel | required "context must include 'otel'!" -}}
{{- $defaults := .defaults | required "context must include 'defaults'!" }}
{{- $chart := .chart | required "context must include 'chart'!" -}}
- name: {{ default "otel-collector" $otel.nameOverride }}
  image: {{ include "fullstack.container.image" (dict "image" $otel.image "Chart" $chart "defaults" $defaults) }}
  imagePullPolicy: {{ include "fullstack.images.pullPolicy" (dict "image" $otel.image "defaults" $defaults) }}
  securityContext:
    {{- include "fullstack.root.security.context" . | nindent 4 }}
  {{- with default $defaults.ports $otel.ports }}
  ports:
    {{- toYaml . | nindent 4 }}
  {{- end }}
  {{- with default $defaults.livenessProbe $otel.livenessProbe }}
  livenessProbe:
    {{- toYaml . | nindent 4 }}
  {{- end }}
  {{- with default $defaults.readinessProbe $otel.readinessProbe }}
  readinessProbe:
    {{- toYaml . | nindent 4 }}
  {{- end }}
  volumeMounts:
    - name: otel-collector-volume
      mountPath: /etc/otel-collector-config.yaml
      subPath: config.yaml #key in the configmap
      readOnly: true
  {{- with default $defaults.resources $otel.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end -}}
