import * as core from "../core/index.mjs";

// list of common flags across commands. command specific flags are defined in the command's module.
export const clusterNameFlag = {
    describe: 'Cluster name',
    default: core.constants.CLUSTER_NAME,
    alias: 'c',
    type: 'string'
}

export const namespaceFlag = {
    describe: 'Namespace',
    default: core.constants.NAMESPACE_NAME,
    alias: 's',
    type: 'string'
}

export const defaultNamespaceFlag = {
    describe: 'Namespace',
    default: 'default',
    alias: 's',
    type: 'string'
}

export const deployMirrorNode = {
    describe: 'Deploy mirror node',
    default: true,
    alias: 'm',
    type: 'boolean'
}

export const deployHederaExplorer = {
    describe: 'Deploy hedera explorer',
    default: true,
    alias: 'x',
    type: 'boolean'
}

export const valuesFile = {
    describe: 'Helm chart values file [ to override defaults ]',
    default: "",
    alias: 'f',
    type: 'string'
}

export const deployPrometheusStack = {
    describe: 'Deploy prometheus stack',
    default: true,
    alias: 'p',
    type: 'boolean'
}

export const deployMinio = {
    describe: 'Deploy minio operator',
    default: true,
    alias: 'o',
    type: 'boolean'
}

export const deployEnvoyGateway = {
    describe: 'Deploy envoy gateway',
    default: true,
    alias: 'e',
    type: 'boolean'
}

export const deployCertManager = {
    describe: 'Deploy cert manager',
    default: false,
    alias: 'r',
    type: 'boolean'
}

/*
    Deploy cert manager CRDs separately from cert manager itself.  Cert manager
    CRDs are required for cert manager to deploy successfully.
 */
export const deployCertManagerCRDs = {
    describe: 'Deploy cert manager CRDs',
    default: false,
    alias: 'd',
    type: 'boolean'
}

export const platformReleaseTag = {
    describe: 'Platform release tag (e.g. v0.42.4, fetch build-<tag>.zip from https://builds.hedera.com)',
    default: "",
    alias: 't',
    type: 'string'
}

export const platformReleaseDir = {
    describe: `Platform release cache dir (containing release directories named as v<major>.<minor>. e.g. v0.42)`,
    default: core.constants.FST_CACHE_DIR,
    alias: 'd',
    type: 'string'
}

export const nodeIDs = {
    describe: 'Comma separated node IDs (empty means all nodes)',
    default: "",
    alias: 'i',
    type: 'string'
}

export const force= {
    describe: 'Force actions even if those can be skipped',
    default: false,
    alias: 'f',
    type: 'boolean'
}
