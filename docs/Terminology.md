# Terminology

This page collects a standard vocabulary to avoid any confusion when communicating with stakeholders.
You can refer to list of [Overloaded Terms](./Overloaded Terms.md).

- Network Deployment
    - represents everything in the k8s namespace
        - Node Software Pod
        - minio deployment
        - mirror node deployment
        - mirror node explorer
        - json rpc relay
        - envoy proxy
        - haproxy
    - A single k8s cluster can have many Network Deployment

- Node Software Pod ( 1 k8s statefulset )
    - Hedera App Software
    - Platform Software
    - Side cars
        - state backup uploader
        - stream uploader
            - record
            - sidecars
            - post consensus eventStreams
            - account balances
- Mirror node deployment
    - importer
        - only handles record streams, account balances and sidecars
- Proxy deployment
- Mirror node explorer deployment
- JSON RPC replay deployment
- minio deployment
    - post consesus event streams
    - accountbalances
    - sidecars
    - record
    - state backups
- Full Stack Cluster Operators
    - Minio Operator,
    - ~ Prometheus / Grafana Operators
    - Cert Manager
    - Ingress Operator
    - Sealed secrets operator ?

Settings and Configuration
- Platform Settings
    - setting.txt
- Platform Configuration
    - config.txt
- Node Software Address Books
    - account  101 .bin
    - account 102 .bin
- Node Software Logging Configuration
    - log4j2.xml
- Node Software App Configuration
    - platform sdk test apps
        - varies
    - hedera app
        - bootstrap.properties
        - node.properties

Keys
- platform software gossip mutual TLS keys
    - public key store
    - private key store
- hedera app tls keys
    - certificate
    - private key