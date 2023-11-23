import * as core from './../core/index.mjs'

/**
 * Set flag from the flag option
 * @param y an instance of yargs
 * @param commandFlags a set of command flags
 *
 */
export function setCommandFlags (y, ...commandFlags) {
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
  name: 'mirror-node',
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
    describe: 'Comma separated chart values files',
    default: '',
    alias: 'f',
    type: 'string'
  }
}

export const deployPrometheusStack = {
  name: 'prometheus-stack',
  definition: {
    describe: 'Deploy prometheus stack',
    default: true,
    type: 'boolean'
  }
}

export const deployMinio = {
  name: 'minio',
  definition: {
    describe: 'Deploy minio operator',
    default: true,
    type: 'boolean'
  }
}

export const deployEnvoyGateway = {
  name: 'envoy-gateway',
  definition: {
    describe: 'Deploy envoy gateway',
    default: true,
    type: 'boolean'
  }
}

export const deployCertManager = {
  name: 'cert-manager',
  definition: {
    describe: 'Deploy cert manager',
    default: false,
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
    type: 'boolean'
  }
}

export const deployJsonRpcRelay = {
  name: 'json-rpc-relay',
  definition: {
    describe: 'Deploy JSON RPC Relay',
    default: false,
    alias: 'j',
    type: 'boolean'
  }
}

export const releaseTag = {
  name: 'release-tag',
  definition: {
    describe: 'Release tag to be used (e.g. v0.42.5)',
    default: '',
    alias: 't',
    type: 'string'
  }
}

export const cacheDir = {
  name: 'cache-dir',
  definition: {
    describe: 'Local cache directory containing platform release artifacts',
    alias: 'd',
    type: 'string'
  }
}

export const nodeIDs = {
  name: 'node-ids',
  definition: {
    describe: 'Comma separated node IDs (empty means all nodes)',
    default: '',
    alias: 'i',
    type: 'string'
  }
}

export const force = {
  name: 'force',
  definition: {
    describe: 'Force actions even if those can be skipped',
    default: false,
    alias: 'f',
    type: 'boolean'
  }
}

export const chartDirectory = {
  name: 'chart-dir',
  definition: {
    describe: 'Local chart directory path (e.g. ~/full-stack-testing/charts',
    default: '',
    alias: 'd',
    type: 'string'
  }
}

export const replicaCount = {
  name: 'replica-count',
  definition: {
    describe: 'Replica count',
    default: 1,
    alias: '',
    type: 'number'
  }
}

export const chainId = {
  name: 'chain-id',
  definition: {
    describe: 'Chain ID',
    default: '298', // Ref: https://github.com/hashgraph/hedera-json-rpc-relay#configuration
    type: 'string'
  }
}

// Ref: https://github.com/hashgraph/hedera-json-rpc-relay/blob/main/docs/configuration.md
export const operatorId = {
  name: 'operator-id',
  definition: {
    describe: 'Operator ID',
    default: '0.0.2',
    type: 'string'
  }
}

// Ref: https://github.com/hashgraph/hedera-json-rpc-relay/blob/main/docs/configuration.md
export const operatorKey = {
  name: 'operator-key',
  definition: {
    describe: 'Operator Key',
    default: '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137',
    type: 'string'
  }
}

export const allFlags = [
  clusterName,
  namespace,
  deployMirrorNode,
  deployHederaExplorer,
  deployJsonRpcRelay,
  valuesFile,
  deployPrometheusStack,
  deployMinio,
  deployEnvoyGateway,
  deployCertManagerCRDs,
  releaseTag,
  cacheDir,
  nodeIDs,
  force,
  chartDirectory,
  replicaCount,
  chainId,
  operatorId,
  operatorKey
]
