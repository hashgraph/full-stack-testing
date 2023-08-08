{{- define "fullstack.sidecars.accountBalanceUploader" }}
{{- $balanceUploader := .balanceUploader | required "context must include 'balanceUploader'!" -}}
{{- $defaults := .defaults | required "context must include 'defaults'!" }}
{{- $cloud := .cloud | required "context must include 'cloud'!" -}}
{{- $chart := .chart | required "context must include 'chart'!" -}}
{{- $nodeId := .nodeId -}}
- name: {{ default "account-balance-uploader" $balanceUploader.nameOverride }}
  image: {{ include "fullstack.container.image" (dict "image" $balanceUploader.image "Chart" $chart "defaults" $defaults ) }}
  imagePullPolicy: {{ include "fullstack.images.pullPolicy" (dict "image" $balanceUploader.image "defaults" $defaults) }}
  securityContext:
    {{- include "fullstack.hedera.security.context" . | nindent 4 }}
  command:
    - /usr/bin/env
    - python3.7
    - /usr/local/bin/mirror.py
    - --linux
    - --watch-directory
    - /opt/hgcapp/accountBalances
    - --s3-endpoint
    - http://myminio-hl:9000
  volumeMounts:
    - name: hgcapp-storage
      mountPath: /opt/hgcapp/accountBalances
      subPath: accountBalances/balance{{ $nodeId }}
  env:
    - name: DEBUG
      value: {{ default $defaults.config.debug ($balanceUploader.config).debug | quote }}
    - name: REAPER_ENABLE
      value: {{ default $defaults.config.reaper.enable (($balanceUploader.config).reaper).enable | quote  }}
    - name: REAPER_MIN_KEEP
      value: {{ default $defaults.config.reaper.minKeep (($balanceUploader.config).reaper).minKeep | quote }}
    - name: REAPER_INTERVAL
      value: {{ default $defaults.config.reaper.interval (($balanceUploader.config).reaper).interval  | quote }}
    - name: REAPER_DEFAULT_BACKOFF
      value: {{ default $defaults.config.reaper.defaultBackoff (($balanceUploader.config).reaper).defaultBackoff | quote }}
    - name: STREAM_FILE_EXTENSION
      value: "pb"
    - name: STREAM_SIG_EXTENSION
      value: "pb_sig"
    - name: STREAM_EXTENSION
      value: {{ default $defaults.config.compression ($balanceUploader.config).compression | eq "true" | ternary "pb.gz" "pb" | quote }}
    - name: SIG_EXTENSION
      value: {{ default $defaults.config.compression ($balanceUploader.config).compression | eq "true" | ternary "pb_sig.gz" "pb_sig" | quote }}
    - name: SIG_REQUIRE
      value: {{ default $defaults.config.signature.require (($balanceUploader.config).signature).require | quote }}
    - name: SIG_PRIORITIZE
      value: {{ default $defaults.config.signature.prioritize (($balanceUploader.config).signature).prioritize | quote }}
    - name: BUCKET_PATH
      value: "accountbalance"
    - name: BUCKET_NAME
      value: {{ $cloud.buckets.streamBucket | quote }}
    - name: S3_ENABLE
      value: {{ $cloud.s3.enable | quote }}
    - name: GCS_ENABLE
      value: {{ $cloud.gcs.enable | quote }}
  envFrom:
    - secretRef:
        name: uploader-mirror-secrets
  {{- with $balanceUploader.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
