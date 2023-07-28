{{- define "sidecars.otel-collector" -}}
{{- $otel := .Values.sidecars.otel -}}
- name: otel-collector
  image: "{{ $otel.image.repository }}:{{ $otel.image.tag }}"
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
