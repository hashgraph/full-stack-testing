{{- define "sidecars.otel-collector" -}}
{{- $otel := .otel -}}
{{- $chart := .chart -}}
- name: {{ $otel.nameOverride | default "otel-collector" }}
  image: "{{ $otel.image.registry }}/{{ $otel.image.repository }}:{{ $otel.image.tag | default $chart.AppVersion }}"
  imagePullPolicy: {{ $otel.image.pullPolicy }}
  ports:
    {{- range $key, $port := $otel.ports }}
    {{- if $port.enabled }}
    - name: {{ $key }}
      containerPort: {{ $port.containerPort }}
      protocol: {{ $port.protocol }}
    {{- end }}
    {{- end }}
  livenessProbe:
    httpGet:
      path: /
      port: healthcheck
  readinessProbe:
    httpGet:
      path: /
      port: healthcheck
  {{- with $otel.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
  {{- with $otel.volumes }}
  volumeMounts:
    {{- toYaml . | nindent 4}}
  {{- end }}
{{- end -}}
