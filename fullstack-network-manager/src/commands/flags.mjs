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