{{- define "sidecars.backup-uploader "}}
{{- $backupUploader := .backupUploader | required "context must include 'backupUploder'!" -}}
{{- $chart := .chart | required "context must include 'chart'!" -}}
- name: {{ $backupUploader.nameOverride | default "backup-uploader" }}
  image: {{ include "container.image" (dict "image" $backupUploader.image "Chart" $chart) }}
  imagePullPolicy: {{ include "images.pullPolicy" $backupUploader.image }}
  securityContext:
    {{- include "hedera.security.context" . | nindent 4 }}
  volumeMounts:
    - name: hgcapp-storage
      mountPath: /opt/hgcapp/
      readOnly: true
  env:
    - name: BACKUP_UPLOADER_BUCKET_1
      value: "{{ $backupUploader.config.backupBucket}}"
  envFrom:
    - secretRef:
        name: backup-uploader-secrets
  {{- with $backupUploader.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end}}
