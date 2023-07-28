{{- define "sidecars" -}}
{{- $recordStream := .node.sidecars.recordStreamUploader -}}
{{- $eventStream := .node.sidecars.eventStreamUploader -}}
{{- $balanceUploader := .node.sidecars.accountBalanceUploader -}}
{{- $backupUploader := .node.sidecars.backupUploader -}}
{{- $otel := .node.sidecars.otelCollector -}}
{{- $cloud := .cloud -}}
{{- $chart := .chart -}}
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