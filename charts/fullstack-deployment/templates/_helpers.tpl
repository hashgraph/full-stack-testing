{{- define "fullstack.testLabels" -}}
  fullstack.hedera.com/testSuiteName: {{ $.Values.deployment.testMetadata.testSuiteName }}
  fullstack.hedera.com/testName: {{ $.Values.deployment.testMetadata.testName }}
  fullstack.hedera.com/testRunUID: {{ $.Values.deployment.testMetadata.testRunUID }}
  fullstack.hedera.com/creationTimestamp: {{ $.Values.deployment.testMetadata.creationTimestamp }}
  fullstack.hedera.com/expirationTimestamp: {{ $.Values.deployment.testMetadata.expirationTimestamp }}
  fullstack.hedera.com/requester: {{ $.Values.deployment.testMetadata.requester }}
{{- end }}

{{- define "fullstack.hedera.security.context" -}}
runAsUser: 2000
runAsGroup: 2000
{{- end }}

{{- define "fullstack.root.security.context" -}}
runAsUser: 0
runAsGroup: 0
{{- end }}

{{- define "fullstack.root.security.context.privileged" -}}
runAsUser: 0
runAsGroup: 0
privileged: true
{{- end }}

{{- define "fullstack.defaultEnvVars" -}}
- name: POD_IP
  valueFrom:
    fieldRef:
      fieldPath: status.podIP
{{- end }}

{{- define "fullstack.images.pullPolicy" -}}
{{ (.image).pullPolicy | default .defaults.image.pullPolicy }}
{{- end }}


{{- define "fullstack.container.image" -}}
{{- $reg := (.image).registry | default .defaults.image.registry -}}
{{- $repo := (.image).repository | default .defaults.image.repository -}}
{{- $tag := default .defaults.image.tag (.image).tag | default .Chart.AppVersion -}}
{{ $reg }}/{{ $repo }}:{{ $tag }}
{{- end }}

{{- define "minio.configEnv" -}}
export MINIO_ROOT_USER={{ include "minio.accessKey" . }}
export MINIO_ROOT_PASSWORD={{ include "minio.secretKey" . }}
{{- end -}}