{{- define "sidecars.backup-uploader "}}
{{- $backupUploader := .backupUploader -}}
{{- $chart := .chart -}}
- name: {{ $backupUploader.nameOverride | default "backup-uploader" }}
  image: "{{ $backupUploader.image.registry }}/{{ $backupUploader.image.repository }}:{{ $backupUploader.image.tag | default $chart.AppVersion }}"
  {{- include "hedera.security.context" . | nindent 2 }}
  volumeMounts:
    - name: hgcapp-storage
      mountPath: /opt/hgcapp/
      readOnly: true
  envFrom:
    - configMapRef:
        name: backup-uploader-cm
    - secretRef:
        name: backup-uploader-secrets
  {{- with $backupUploader.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end}}