{{ - define "hedera.security.context" -}}
securityContext:
    runAsUser: 2000
    runAsGroup: 2000
{{- end }}
