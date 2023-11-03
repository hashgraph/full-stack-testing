{{- define "fullstack.sidecars.eventStreamUploader" }}
{{- $eventStream := .eventStream | required "context must include 'eventStream'!"  -}}
{{- $defaults := .defaults | required "context must include 'defaults'!" }}
{{- $cloud := .cloud | required "context must include 'cloud'!" -}}
{{- $chart := .chart | required "context must include 'chart'!" -}}
{{- $nodeId := .nodeId -}}
{{- $minioserver := .minioserver -}}
- name: {{ default "event-stream-uploader" $eventStream.nameOverride }}
  image: {{ include "fullstack.container.image" (dict "image" $eventStream.image "Chart" $chart "defaults" $defaults) }}
  imagePullPolicy: {{ include "fullstack.images.pullPolicy" (dict "image" $eventStream.image "defaults" $defaults) }}
  securityContext:
    {{- include "fullstack.hedera.security.context" . | nindent 4 }}
  command:
    - /usr/bin/env
    - python3.7
    - /usr/local/bin/mirror.py
    - --linux
    - --watch-directory
    - /opt/hgcapp/events
    - --debug
    - --s3-endpoint
    - http://{{ $minioserver.tenant.name }}-hl:9000
  volumeMounts:
    - name: hgcapp-storage
      mountPath: /opt/hgcapp/events
      subPath: events/balance{{ $nodeId }}
  env:
    - name: DEBUG
      value: {{ default $defaults.config.debug ($eventStream.config).debug | quote}}
    - name: REAPER_ENABLE
      value: {{ default $defaults.config.reaper.enabled (($eventStream.config).reaper).enabled | quote }}
    - name: REAPER_MIN_KEEP
      value: {{ default $defaults.config.reaper.minKeep (($eventStream.config).reaper).minKeep | quote }}
    - name: REAPER_INTERVAL
      value: {{ default $defaults.config.reaper.interval (($eventStream.config).reaper).interval | quote }}
    - name: REAPER_DEFAULT_BACKOFF
      value: {{ default $defaults.config.reaper.defaultBackoff (($eventStream.config).reaper).defaultBackoff | quote }}
    - name: STREAM_FILE_EXTENSION
      value: "evts"
    - name: STREAM_SIG_EXTENSION
      value: "evts_sig"
    - name: STREAM_EXTENSION
      value: {{ default $defaults.config.compression ($eventStream.config).compression | eq "true" | ternary "evts.gz" "evts" | quote }}
    - name: SIG_EXTENSION
      value: {{ default $defaults.config.compression ($eventStream.config).compression | eq "true" | ternary "evts_sig.gz" "evts_sig" | quote }}
    - name: SIG_REQUIRE
      value: {{ default $defaults.config.signature.require (($eventStream.config).signature).require | quote }}
    - name: SIG_PRIORITIZE
      value: {{ default $defaults.config.signature.prioritize (($eventStream.config).signature).prioritize | quote }}
    - name: BUCKET_PATH
      value: "eventsStreams/events_{{ $nodeId }}"
    - name: BUCKET_NAME
      value: {{ $cloud.buckets.streamBucket | quote }}
    - name: S3_ENABLE
      value: "true"
    - name: GCS_ENABLE
      value: "false"
  envFrom:
    - secretRef:
        name: uploader-mirror-secrets
  {{- with $eventStream.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
