{{- define "sidecars" -}}
{{- $recordStream := .recordStream | default dict -}}
{{- $eventStream := .eventStream | default dict -}}
{{- $balanceUploader := .balanceUploader | default dict -}}
{{- $backupUploader := .backupUploader | default dict -}}
{{- $otel := .otel | default dict -}}
{{- $cloud := .cloud | required "context must include 'cloud'!" -}}
{{- $chart := .chart | required "context must include 'chart'!" -}}
  {{- if $recordStream.enabled -}}
  # Sidecar: Record Stream Uploader
  {{- $data := dict "recordStream" $recordStream "cloud" $cloud "chart" $chart -}}
  {{ include "sidecars.record-stream-uploader" $data | nindent 0 }}
  {{- end }}
  {{- if $eventStream.enabled }}
  # Sidecar: Event Stream Uploader
  {{- $data := dict "eventStream" $eventStream "cloud" $cloud "chart" $chart -}}
  {{ include "sidecars.event-stream-uploader" $data | nindent 0 }}
  {{- end }}
  {{- if $balanceUploader.enabled }}
  # Sidecar: Account Balance Uploader
  {{- $data := dict "balanceUploader" $balanceUploader "cloud" $cloud "chart" $chart -}}
  {{ include "sidecars.account-balance-uploader" $data | nindent 0 }}
  {{- end }}
  {{- if $backupUploader.enabled }}
  # Sidecar: Backup Uploader
  {{- $data := dict "backupUploader" $backupUploader "cloud" $cloud "chart" $chart -}}
  {{ include "sidecars.backup-uploader " $data | nindent 0 }}
  {{- end }}
  {{- if $otel.enabled }}
  # Sidecar: OTel Collector
  {{- $data := dict "otel" $otel "chart" $chart -}}
  {{ include "sidecars.otel-collector" $data | nindent 0 }}
  {{- end }}
{{- end }}
