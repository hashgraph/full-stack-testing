{{- define "hedera.security.context" -}}
runAsUser: 2000
runAsGroup: 2000
{{- end }}

{{- define "root.security.context" -}}
runAsUser: 0
runAsGroup: 0
{{- end }}

{{- define "root.security.context.privileged" -}}
runAsUser: 0
runAsGroup: 0
privileged: true
{{- end }}

{{- define "default-env-vars" -}}
- name: POD_IP
  valueFrom:
    fieldRef:
      fieldPath: status.podIP
{{- end }}

{{- define "images.pullPolicy" -}}
{{ .pullPolicy | default "IfNotPresent" }}
{{- end }}


{{- define "container.image" -}}
{{- $reg := .image.registry | default "gcr.io" -}}
{{- $repo := .image.repository | default "" -}}
{{- $tag := .image.tag | default .Chart.Version -}}
{{ $reg }}/{{ $repo }}:{{ $tag }}
{{- end }}