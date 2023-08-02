{{- define "sidecars.account-balance-uploader" }}
{{- $balanceUploader := .balanceUploader | required "context must include 'balanceUploader'!" -}}
{{- $cloud := .cloud | required "context must include 'cloud'!" -}}
{{- $chart := .chart | required "context must include 'chart'!" -}}
- name: {{ $balanceUploader.nameOverride | default "account-balance-uploader" }}
  image: {{ include "container.image" (dict "image" $balanceUploader.image "Chart" $chart) }}
  imagePullPolicy: {{ include "images.pullPolicy" $balanceUploader.image }}
  securityContext:
    {{- include "hedera.security.context" . | nindent 4 }}
  command:
    - /usr/bin/env
    - python3.7
    - /usr/local/bin/mirror.py
    - --linux
    - --watch-directory
    - /opt/hgcapp/accountbalance
  volumeMounts:
    - name: hgcapp-storage
      mountPath: /opt/hgcapp/
  env:
    - name: DEBUG
      value: "{{ $balanceUploader.config.debug }}"
    - name: REAPER_ENABLE
      value: "{{ $balanceUploader.config.reaper.enable }}"
    - name: REAPER_MIN_KEEP
      value: "{{ $balanceUploader.config.reaper.minKeep }}"
    - name: REAPER_INTERVAL
      value: "{{ $balanceUploader.config.reaper.interval }}"
    - name: REAPER_DEFAULT_BACKOFF
      value: "{{ $balanceUploader.config.reaper.defaultBackoff }}"
    - name: STREAM_FILE_EXTENSION
      value: "pb"
    - name: STREAM_SIG_EXTENSION
      value: "pb_sig"
    - name: STREAM_EXTENSION
      value: "{{ $balanceUploader.config.compression | ternary "pb.gz" "pb" }}"
    - name: SIG_EXTENSION
      value: "{{ $balanceUploader.config.compression | ternary "pb_sig.gz" "pb_sig" }}"
    - name: SIG_REQUIRE
      value: "{{ $balanceUploader.config.signature.require }}"
    - name: SIG_PRIORITIZE
      value: "{{ $balanceUploader.config.signature.prioritize }}"
    - name: BUCKET_PATH
      value: "/accountbalance"
    - name: BUCKET_NAME
      value: "{{ $cloud.buckets.streamBucket }}"
    - name: S3_ENABLE
      value: "{{ $cloud.s3.enabled }}"
    - name: GCS_ENABLE
      value: "{{ $cloud.gcs.enabled }}"
  envFrom:
    - secretRef:
        name: uploader-mirror-secrets
  {{- with $balanceUploader.resources }}
  resources:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
