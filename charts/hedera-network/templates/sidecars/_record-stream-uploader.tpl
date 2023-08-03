{{- define "sidecars.record-stream-uploader" }}
{{- $recordStream := .recordStream | required "context must include 'recordStream'!" -}}
{{- $cloud := .cloud | required "context must include 'cloud'!" -}}
{{- $chart := .chart | required "context must include 'chart'!" -}}
- name: {{ $recordStream.nameOverride | default "record-stream-uploader" }}
  image: {{ include "container.image" (dict "image" $recordStream.image "Chart" $chart) }}
  imagePullPolicy: {{ include "images.pullPolicy" $recordStream.image }}
  securityContext:
    {{- include "hedera.security.context" . | nindent 4 }}
  command:
    - /usr/bin/env
    - python3.7
    - /usr/local/bin/mirror.py
    - --linux
    - --watch-directory
    - /opt/hgcapp/recordstream
    - --csv-stats-directory
    - /opt/hgcapp/recordstream/uploader-stats
  volumeMounts:
    - name: hgcapp-storage
      mountPath: /opt/hgcapp/
  env:
    - name: DEBUG
      value: "{{ $recordStream.config.debug }}"
    - name: REAPER_ENABLE
      value: "{{ $recordStream.config.reaper.enable }}"
    - name: REAPER_MIN_KEEP
      value: "{{ $recordStream.config.reaper.minKeep }}"
    - name: REAPER_INTERVAL
      value: "{{ $recordStream.config.reaper.interval }}"
    - name: REAPER_DEFAULT_BACKOFF
      value: "{{ $recordStream.config.reaper.defaultBackoff }}"
    - name: STREAM_FILE_EXTENSION
      value: "rcd"
    - name: STREAM_SIG_EXTENSION
      value: "rcd_sig"
    - name: STREAM_EXTENSION
      value: "{{ $recordStream.config.compression | ternary "rcd.gz" "rcd" }}"
    - name: SIG_EXTENSION
      value: "{{ $recordStream.config.compression | ternary "rcd_sig.gz" "rcd_sig" }}"
    - name: RECORD_STREAM_COMPRESSION
      value: "{{ $recordStream.config.compression }}"
    - name: RECORD_STREAM_SIDECAR
      value: "{{ $recordStream.config.sidecar }}"
    - name: SIG_REQUIRE
      value: "{{ $recordStream.config.signature.require }}"
    - name: SIG_PRIORITIZE
      value: "{{ $recordStream.config.signature.prioritize }}"
    - name: BUCKET_PATH
      value: "/recordstream"
    - name: BUCKET_NAME
      value: "{{ $cloud.buckets.streamBucket }}"
    - name: S3_ENABLE
      value: "{{ $cloud.s3.enabled }}"
    - name: GCS_ENABLE
      value: "{{ $cloud.gcs.enabled }}"
  envFrom:
    - secretRef:
        name: uploader-mirror-secrets
  {{- with $recordStream.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
