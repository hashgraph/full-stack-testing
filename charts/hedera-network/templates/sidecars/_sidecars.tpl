{{- define "sidecars" -}}
{{- $recordStream := .node.sidecars.recordStreamUploader -}}
{{- $cloud := .cloud -}}
{{- $chart := .chart -}}
  {{- if $recordStream.enabled -}}
  # Sidecar: Record Stream Uploader
  {{- $data := dict "recordStream" $recordStream "cloud" $cloud "chart" $chart -}}
  {{ include "sidecars.record-stream-uploader" $data | nindent 0 }}
  {{- end }}
{{- end }}