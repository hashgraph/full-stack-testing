{{- define "sidecars.backup-uploader "}}
{{- $backupUploader := .backupUploader | required "context must include 'backupUploader'!" -}}
{{- $defaults := .defaults | required "context must include 'defaults'!" }}
{{- $chart := .chart | required "context must include 'chart'!" -}}
- name: {{ default "backup-uploader" $backupUploader.nameOverride }}
  image: {{ include "container.image" (dict "image" $backupUploader.image "Chart" $chart "defaults" $defaults) }}
  imagePullPolicy: {{ include "images.pullPolicy" (dict "image" $backupUploader.image "defaults" $defaults) }}
  securityContext:
    {{- include "fullstack.hedera.security.context" . | nindent 4 }}
  volumeMounts:
    - name: hgcapp-storage
      mountPath: /opt/hgcapp/
      readOnly: true
  env:
    - name: BACKUP_UPLOADER_BUCKET_1
      value: {{ default $defaults.config.backupBucket ($backupUploader.config).backupBucket | quote }}
  envFrom:
    - secretRef:
        name: backup-uploader-secrets
  {{- with $backupUploader.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end}}
