import * as core from './../core/index.mjs'

/**
 * Set flag from the flag option
 * @param y an instance of yargs
 * @param commandFlags a set of command flags
 *
 */
export function setCommandFlags(y, ...commandFlags) {
    commandFlags.forEach(flag => {
        y.option(flag.name, flag.definition)
    })
}

// list of common flags across commands. command specific flags are defined in the command's module.
export const clusterName = {
    name: 'cluster-name',
    definition: {
        describe: 'Cluster name',
        default: core.constants.CLUSTER_NAME,
        alias: 'c',
        type: 'string'
    }
}

export const namespace = {
    name: 'namespace',
    definition: {
        describe: 'Namespace',
        default: core.constants.NAMESPACE_NAME,
        alias: 'n',
        type: 'string'
    }
}

export const deployMirrorNode = {
    name: "mirror-node",
    definition: {
        describe: 'Deploy mirror node',
        default: true,
        alias: 'm',
        type: 'boolean'
    }
}

export const deployHederaExplorer = {
    name: 'hedera-explorer',
    definition: {
        describe: 'Deploy hedera explorer',
        default: true,
        alias: 'x',
        type: 'boolean'
    }
}

export const valuesFile = {
    name: 'values-file',
    definition: {
        describe: 'Helm chart values file [ to override defaults ]',
        default: "",
        alias: 'f',
        type: 'string'
    }
}

export const deployPrometheusStack = {
    name: 'prometheus-stack',
    definition: {
        describe: 'Deploy prometheus stack',
        default: true,
        alias: 'p',
        type: 'boolean'
    }
}

export const deployMinio = {
    name: 'minio',
    definition: {
        describe: 'Deploy minio operator',
        default: true,
        alias: 'o',
        type: 'boolean'
    }
}

export const deployEnvoyGateway = {
    name: 'envoy-gateway',
    definition: {
        describe: 'Deploy envoy gateway',
        default: true,
        alias: 'e',
        type: 'boolean'
    }
}

export const deployCertManager = {
    name: 'cert-manager',
    definition: {
        describe: 'Deploy cert manager',
        default: false,
        alias: 'r',
        type: 'boolean'
    }
}

/*
    Deploy cert manager CRDs separately from cert manager itself.  Cert manager
    CRDs are required for cert manager to deploy successfully.
 */
export const deployCertManagerCRDs = {
    name: 'cert-manager-crds',
    definition: {
        describe: 'Deploy cert manager CRDs',
        default: false,
        alias: 'd',
        type: 'boolean'
    }
}

export const platformReleaseTag = {
    name: 'release-tag',
    definition: {
        describe: 'Platform release tag (e.g. v0.42.4, fetch build-<tag>.zip from https://builds.hedera.com)',
        default: "",
        alias: 't',
        type: 'string'
    }
}

export const platformReleaseDir = {
    name: 'release-dir',
    definition: {
        describe: `Platform release cache dir (containing release directories named as v<major>.<minor>. e.g. v0.42)`,
        default: core.constants.FST_CACHE_DIR,
        alias: 'd',
        type: 'string'
    }
}

export const nodeIDs = {
    name: 'node-ids',
    definition: {
        describe: 'Comma separated node IDs (empty means all nodes)',
        default: "",
        alias: 'i',
        type: 'string'
    }
}

export const force= {
    name: 'force',
    definition: {
        describe: 'Force actions even if those can be skipped',
        default: false,
        alias: 'f',
        type: 'boolean'
    }
}

export const chartDirectory= {
    name: 'chart-dir',
    definition: {
        describe: 'Local chart directory path (e.g. ~/full-stack-testing/charts',
        default: '',
        alias: 'd',
        type: 'string'
    }
}

export const allFlags = [
    clusterName,
    namespace,
    deployMirrorNode,
    deployHederaExplorer,
    valuesFile,
    deployPrometheusStack,
    deployMinio,
    deployEnvoyGateway,
    deployCertManagerCRDs,
    platformReleaseTag,
    platformReleaseDir,
    nodeIDs,
    force,
    chartDirectory,
]