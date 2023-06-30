{{- define "network-node.root-container" -}}
{{- $node := .Values -}}
- name: {{ .Chart.Name }}
  securityContext:
    {{- toYaml $node.securityContext | nindent 4 }}
  image: "{{ $node.image.repository }}:{{ $node.image.tag | default .Chart.AppVersion }}"
  imagePullPolicy: {{ $node.image.pullPolicy }}
  command: ["/bin/sh", "-c", "while true; do echo heartbeat; sleep 10;done"]
  ports:
    - name: http
      containerPort: {{ $node.service.port }}
      protocol: TCP
  {{- with $node.livenessProbe }}
  livenessProbe:
    {{- toYaml . | nindent 4 }}
  {{- end }}
  {{- with $node.readinessProbe }}
  readinessProbe:
    {{- toYaml . | nindent 4 }}
  {{- end }}
  {{- with $node.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
  {{- with $node.volumes }}
  volumeMounts:
    {{- toYaml . | nindent 4}}
  {{- end }}
{{- end -}}