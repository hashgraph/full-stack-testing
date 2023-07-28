{{- define "sidecars.event-stream-uploader" }}
{{- $eventStream := .eventStream -}}
{{- $cloud := .cloud -}}
{{- $chart := .chart -}}
- name: {{ $eventStream.nameOverride | default "event-stream-uploader" }}
  image: "{{ $eventStream.image.registry }}/{{ $eventStream.image.repository }}:{{ $eventStream.image.tag | default $chart.AppVersion }}"
  imagePullPolicy: {{$eventStream.image.pullPolicy}}
  {{- include "hedera.security.context" $ | nindent 2 }}
  command:
    - /usr/bin/env
    - python3.7
    - /usr/local/bin/mirror.py
    - --linux
    - --watch-directory
    - /opt/hgcapp/events
  volumeMounts:
    - name: hgcapp-storage
      mountPath: /opt/hgcapp/
  env:
    - name: DEBUG
      value: "{{ $eventStream.config.debug }}"
    - name: REAPER_ENABLE
      value: "{{ $eventStream.config.reaper.enable }}"
    - name: REAPER_MIN_KEEP
      value: "{{ $eventStream.config.reaper.minKeep }}"
    - name: REAPER_INTERVAL
      value: "{{ $eventStream.config.reaper.interval }}"
    - name: REAPER_DEFAULT_BACKOFF
      value: "{{ $eventStream.config.reaper.defaultBackoff }}"
    - name: STREAM_FILE_EXTENSION
      value: "evts"
    - name: STREAM_SIG_EXTENSION
      value: "evts_sig"
    - name: STREAM_EXTENSION
      value: "{{ $eventStream.config.compression | ternary "evts.gz" "evts" }}"
    - name: SIG_EXTENSION
      value: "{{ $eventStream.config.compression | ternary "evts_sig.gz" "evts_sig" }}"
    - name: SIG_REQUIRE
      value: "{{ $eventStream.config.signature.require }}"
    - name: SIG_PRIORITIZE
      value: "{{ $eventStream.config.signature.prioritize }}"
    - name: BUCKET_PATH
      value: "/events"
    - name: BUCKET_NAME
      value: "{{ $cloud.buckets.streamBucket }}"
    - name: S3_ENABLE
      value: "{{ $cloud.s3.enabled }}"
    - name: GCS_ENABLE
      value: "{{ $cloud.gcs.enabled }}"
  envFrom:
    - secretRef:
        name: uploader-mirror-secrets
  {{- with $eventStream.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}