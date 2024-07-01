{{- define "fullstack.testLabels" -}}
{{- if .Values.deployment.testMetadata.enabled -}}
{{- with .Values.deployment.testMetadata -}}
fullstack.hedera.com/testSuiteName: "{{ .testSuiteName }}"
fullstack.hedera.com/testName: "{{ .testName }}"
fullstack.hedera.com/testRunUID: "{{ .testRunUID }}"
fullstack.hedera.com/testCreationTimestamp: "{{ .testCreationTimestamp }}"
fullstack.hedera.com/testExpirationTimestamp: "{{ .testExpirationTimestamp }}"
fullstack.hedera.com/testRequester: "{{ .testRequester }}"
{{- end }}
{{- end }}
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
{{ (.image).pullPolicy | default (((.defaults).root).image).pullPolicy }}
{{- end }}


{{- define "fullstack.container.image" -}}
{{- $reg := (.image).registry | default (((.defaults).root).image).registry -}}
{{- $repo := (.image).repository | default (((.defaults).root).image).repository -}}
{{- $tag := default (((.defaults).root).image).tag (.image).tag | default .Chart.AppVersion -}}
{{ $reg }}/{{ $repo }}:{{ $tag }}
{{- end }}

{{- define "minio.configEnv" -}}
export MINIO_ROOT_USER={{ include "minio.accessKey" . }}
export MINIO_ROOT_PASSWORD={{ include "minio.secretKey" . }}
{{- end -}}

{{- define "fullstack.volumeClaimTemplate" -}}
- metadata:
    name: {{ .name }}
    annotations:
      helm.sh/resource-policy: keep
    labels:
      fullstack.hedera.com/type: node-pvc
  spec:
    accessModes: [ "ReadWriteOnce" ]
    resources:
      requests:
        storage: {{ default "2Gi" .storage }}
{{- end -}}

{{- define "fullstack.volumeTemplate" -}}
- name: {{ .name }}
  {{- if .pvcEnabled }}
  persistentVolumeClaim:
    claimName: {{ .claimName }}
  {{- else }}
  emptyDir: {}
  {{- end }}
{{- end -}}

{{- define "generateHaproxyPassword" -}}
{{- $password := randAlpha 10 -}}
{{- $previous := lookup "v1" "Secret" .Release.Namespace "haproxy-secrets" }}
{{- if and $previous (index $previous.data "haproxy_password") -}}
{{- $password := $previous.data.haproxy_password -}}
{{- end -}}
{{- $_ := set .Values.global "haproxy_password" ($password) -}}
{{- $password -}}
{{- end -}}

{{- define "generateHaproxyUser" -}}
{{- $username := randAlpha 10 -}}
{{- $previous := lookup "v1" "Secret" .Release.Namespace "haproxy-secrets" }}
{{- if and $previous (index $previous.data "haproxy_user") -}}
{{- $username := $previous.data.haproxy_user -}}
{{- end -}}
{{- $_ := set .Values.global "haproxy_user" ($username) -}}
{{- $username -}}
{{- end -}}
