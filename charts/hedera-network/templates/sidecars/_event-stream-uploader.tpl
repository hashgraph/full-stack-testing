{{- define "fullstack.sidecars.eventStreamUploader" }}
{{- $eventStream := .eventStream | required "context must include 'eventStream'!"  -}}
{{- $defaults := .defaults | required "context must include 'defaults'!" }}
{{- $cloud := .cloud | required "context must include 'cloud'!" -}}
{{- $chart := .chart | required "context must include 'chart'!" -}}
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
  volumeMounts:
    - name: hgcapp-storage
      mountPath: /opt/hgcapp/
  env:
    - name: DEBUG
      value: {{ default $defaults.config.debug ($eventStream.config).debug | quote}}
    - name: REAPER_ENABLE
      value: {{ default $defaults.config.reaper.enable (($eventStream.config).reaper).enable | quote }}
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
      value: "/events"
    - name: BUCKET_NAME
      value: {{ $cloud.buckets.streamBucket | quote }}
    - name: S3_ENABLE
      value: {{ $cloud.s3.enable | quote }}
    - name: GCS_ENABLE
      value: {{ $cloud.gcs.enable | quote }}
  envFrom:
    - secretRef:
        name: uploader-mirror-secrets
  {{- with $eventStream.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
