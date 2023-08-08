{{- define "sidecars" -}}
{{- $defaults := .defaults | required "context must include 'defaults'!" -}}
{{- $recordStream := .recordStream | required "context must include 'recordStream'!"  -}}
{{- $eventStream := .eventStream | required "context must include 'eventStream'!" -}}
{{- $balanceUploader := .balanceUploader | required "context must include 'balanceUploader'!" -}}
{{- $backupUploader := .backupUploader | required "context must include 'backupUploader'!" -}}
{{- $otelCollector := .otelCollector | required "context must include 'otelCollector'!" -}}
{{- $cloud := .cloud | required "context must include 'cloud'!" -}}
{{- $chart := .chart | required "context must include 'chart'!" -}}
  {{- if default $defaults.sidecars.recordStreamUploader.enable  $recordStream.enable | eq "true" }}
  # Sidecar: Record Stream Uploader
  {{- $data := dict "recordStream" $recordStream "cloud" $cloud "chart" $chart "defaults" $defaults.sidecars.recordStreamUploader -}}
  {{ include "fullstack.sidecars.recordStreamUploader" $data | nindent 0 }}
  {{- end }}
  {{- if default $defaults.sidecars.eventStreamUploader.enable  $eventStream.enable | eq "true" }}
  # Sidecar: Event Stream Uploader
  {{- $data := dict "eventStream" $eventStream "cloud" $cloud "chart" $chart "defaults" $defaults.sidecars.eventStreamUploader -}}
  {{ include "fullstack.sidecars.eventStreamUploader" $data | nindent 0 }}
  {{- end }}
  {{- if default $defaults.sidecars.accountBalanceUploader.enable $balanceUploader.enable | eq "true" }}
  # Sidecar: Account Balance Uploader
  {{- $data := dict "balanceUploader" $balanceUploader "cloud" $cloud "chart" $chart "defaults" $defaults.sidecars.accountBalanceUploader -}}
  {{ include "fullstack.sidecars.accountBalanceUploader" $data | nindent 0 }}
  {{- end }}
  {{- if default $defaults.sidecars.backupUploader.enable  $backupUploader.enable | eq "true" }}
  # Sidecar: Backup Uploader
  {{- $data := dict "backupUploader" $backupUploader "cloud" $cloud "chart" $chart "defaults" $defaults.sidecars.backupUploader -}}
  {{ include "fullstack.sidecars.backupUploader " $data | nindent 0 }}
  {{- end }}
  {{- if default $defaults.sidecars.otelCollector.enable  $otelCollector.enable | eq "true" }}
  # Sidecar: OTel Collector
  {{- $data := dict "otel" $otelCollector "chart" $chart "defaults" $defaults.sidecars.otelCollector -}}
  {{ include "fullstack.sidecars.otelCollector" $data | nindent 0 }}
  {{- end }}
{{- end }}
