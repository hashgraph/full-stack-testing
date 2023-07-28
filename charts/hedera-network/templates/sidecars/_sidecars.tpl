{{- define "sidecars" -}}
{{- $recordStream := .node.sidecars.recordStreamUploader -}}
{{- $eventStream := .node.sidecars.eventStreamUploader -}}
{{- $balanceUploader := .node.sidecars.accountBalanceUploader -}}
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
{{- end }}