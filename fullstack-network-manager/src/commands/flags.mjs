import { constants } from './../core/index.mjs'
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

export const devMode = {
  name: 'dev',
  definition: {
    describe: 'Enable developer mode',
    default: false,
    type: 'boolean'
  }
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

export const kubeContext = {
  name: 'kube-context',
  definition: {
    describe: 'Kube context',
    default: '',
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
    describe: 'Deploy cert manager, also deploys acme-cluster-issuer',
    default: false,
    type: 'boolean'
  }
}

/*
    Deploy cert manager CRDs separately from cert manager itself.  Cert manager
    CRDs are required for cert manager to deploy successfully.
 */
export const deployCertManagerCrds = {
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
    default: core.constants.FST_CACHE_DIR,
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
    default: constants.OPERATOR_ID,
    type: 'string'
  }
}

// Ref: https://github.com/hashgraph/hedera-json-rpc-relay/blob/main/docs/configuration.md
export const operatorKey = {
  name: 'operator-key',
  definition: {
    describe: 'Operator Key',
    default: constants.OPERATOR_KEY,
    type: 'string'
  }
}

export const enableTls = {
  name: 'enable-tls',
  definition: {
    describe: 'Enables TLS for gateway ingress services [grpcs, grpcWeb, hederaExplorer]',
    default: false,
    type: 'boolean'
  }
}

export const tlsClusterIssuerName = {
  name: 'tls-cluster-issuer-name',
  definition: {
    describe: 'The name of the TLS cluster issuer to use for gateway services, defaults to "self-signed-ca", another option for the acme-cluster-issuer is "letsencrypt-staging" and "letsencrypt-prod"',
    default: 'self-signed',
    type: 'string'
  }
}

export const selfSignedClusterIssuer = {
  name: 'self-signed',
  definition: {
    describe: 'Enable the self signed cluster issuer',
    default: false,
    type: 'boolean'
  }
}

export const tlsClusterIssuerNamespace = {
  name: 'tls-cluster-issuer-namespace',
  definition: {
    describe: 'The namespace of the TLS cluster issuer to use for gateway services, defaults to "cert-manager"',
    default: 'cert-manager',
    type: 'string'
  }
}

export const acmeClusterIssuer = {
  name: 'acme-cluster-issuer',
  definition: {
    describe: 'The acme let\'s encrypt cert-manager cluster issuer, defaults to false',
    default: false,
    type: 'boolean'
  }
}

export const enableHederaExplorerTls = {
  name: 'enable-hedera-explorer-tls',
  definition: {
    describe: 'Enable the Hedera Explorer TLS, defaults to false',
    default: false,
    type: 'boolean'
  }
}

export const allFlags = [
  devMode,
  clusterName,
  namespace,
  kubeContext,
  deployMirrorNode,
  deployHederaExplorer,
  deployJsonRpcRelay,
  valuesFile,
  deployPrometheusStack,
  deployMinio,
  deployEnvoyGateway,
  deployCertManager,
  deployCertManagerCrds,
  acmeClusterIssuer,
  releaseTag,
  cacheDir,
  nodeIDs,
  force,
  chartDirectory,
  replicaCount,
  chainId,
  operatorId,
  operatorKey,
  enableTls,
  tlsClusterIssuerName,
  tlsClusterIssuerNamespace,
  enableHederaExplorerTls,
  selfSignedClusterIssuer
]
