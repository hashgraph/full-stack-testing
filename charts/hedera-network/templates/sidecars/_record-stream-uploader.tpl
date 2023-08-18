{{- define "fullstack.sidecars.recordStreamUploader" }}
{{- $recordStream := .recordStream | required "context must include 'recordStream'!" -}}
{{- $defaults := .defaults | required "context must include 'defaults'!" }}
{{- $cloud := .cloud | required "context must include 'cloud'!" -}}
{{- $chart := .chart | required "context must include 'chart'!" -}}
{{- $nodeId := .nodeId -}}
- name: {{ default "record-stream-uploader" $recordStream.nameOverride }}
  image: {{ include "fullstack.container.image" (dict "image" $recordStream.image "Chart" $chart "defaults" $defaults) }}
  imagePullPolicy: {{ include "fullstack.images.pullPolicy" (dict "image" $recordStream.image "defaults" $defaults) }}
  securityContext:
    {{- include "fullstack.hedera.security.context" . | nindent 4 }}
  command:
    - /usr/bin/env
    - python3.7
    - /usr/local/bin/mirror.py
    - --linux
    - --watch-directory
    - /opt/hgcapp/recordStreams
    - --csv-stats-directory
    - /opt/hgcapp/recordStreams/uploader-stats
    - --s3-endpoint
    - http://minio-hl:9000
  volumeMounts:
    - name: hgcapp-storage
      mountPath: /opt/hgcapp/recordStreams
      subPath: recordStreams/record{{ $nodeId }}
  env:
    - name: DEBUG
      value: {{ default $defaults.config.debug ($recordStream.config).debug | quote }}
    - name: REAPER_ENABLE
      value: {{ default $defaults.config.reaper.enable (($recordStream.config).reaper).enable | quote }}
    - name: REAPER_MIN_KEEP
      value: {{ default $defaults.config.reaper.minKeep (($recordStream.config).reaper).minKeep | quote }}
    - name: REAPER_INTERVAL
      value: {{ default $defaults.config.reaper.interval (($recordStream.config).reaper).interval | quote }}
    - name: REAPER_DEFAULT_BACKOFF
      value: {{ default $defaults.config.reaper.defaultBackoff (($recordStream.config).reaper).defaultBackoff | quote }}
    - name: STREAM_FILE_EXTENSION
      value: "rcd"
    - name: STREAM_SIG_EXTENSION
      value: "rcd_sig"
    - name: STREAM_EXTENSION
      value: {{ default $defaults.config.compression ($recordStream.config).compression | eq "true" | ternary "rcd.gz" "rcd" | quote }}
    - name: SIG_EXTENSION
      value: "rcd_sig"
    - name: RECORD_STREAM_COMPRESSION
      value: {{ default $defaults.config.compression $recordStream.config.compression | quote }}
    - name: RECORD_STREAM_SIDECAR
      value: {{ default $defaults.config.sidecar $recordStream.config.sidecar | quote }}
    - name: SIG_REQUIRE
      value: {{ default $defaults.config.signature.require (($recordStream.config).signature).require | quote }}
    - name: SIG_PRIORITIZE
      value: {{ default $defaults.config.signature.prioritize (($recordStream.config).signature).prioritize | quote }}
    - name: BUCKET_PATH
      value: "recordstreams/record{{ $nodeId }}"
    - name: BUCKET_NAME
      value: {{ $cloud.buckets.streamBucket | quote }}
    - name: S3_ENABLE
      value: "true"
    - name: GCS_ENABLE
      value: "false"
  envFrom:
    - secretRef:
        name: uploader-mirror-secrets
  {{- with $recordStream.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
