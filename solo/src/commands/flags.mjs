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

export function withDefaultValue (f, value) {
  const clone = JSON.parse(JSON.stringify(f))
  clone.definition.default = value
  return clone
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
    default: '',
    alias: 'c',
    type: 'string'
  }
}

export const namespace = {
  name: 'namespace',
  definition: {
    describe: 'Namespace',
    default: '',
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
    default: false,
    type: 'boolean'
  }
}

export const enablePrometheusSvcMonitor = {
  name: 'enable-prometheus-svc-monitor',
  definition: {
    describe: 'Enable prometheus service monitor for the network nodes',
    default: false,
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

export const relayReleaseTag = {
  name: 'relay-release',
  definition: {
    describe: 'Relay release tag to be used (e.g. v0.39.1)',
    default: '',
    type: 'string'
  }
}

export const cacheDir = {
  name: 'cache-dir',
  definition: {
    describe: 'Local cache directory',
    alias: 'd',
    default: core.constants.SOLO_CACHE_DIR,
    type: 'string'
  }
}

export const nodeIDs = {
  name: 'node-ids',
  definition: {
    describe: 'Comma separated node IDs (empty means all nodes)',
    default: 'node0,node1,node2',
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
  name: 'ledger-id',
  definition: {
    describe: 'Ledger ID (a.k.a. Chain ID)',
    default: '298', // Ref: https://github.com/hashgraph/hedera-json-rpc-relay#configuration
    alias: 'l',
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

export const generateGossipKeys = {
  name: 'gossip-keys',
  definition: {
    describe: 'Generate gossip keys for nodes',
    default: ''
  }
}

export const generateTlsKeys = {
  name: 'tls-keys',
  definition: {
    describe: 'Generate gRPC TLS keys for nodes',
    default: ''
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

export const keyFormat = {
  name: 'key-format',
  definition: {
    describe: 'Public and Private key file format (pem or pfx)',
    default: 'pfx'
  }
}

export const tlsClusterIssuerType = {
  name: 'tls-cluster-issuer-type',
  definition: {
    describe: 'The TLS cluster issuer type to use for hedera explorer, defaults to "self-signed", the available options are: "acme-staging", "acme-prod", or "self-signed"',
    default: 'self-signed',
    type: 'string'
  }
}

export const enableHederaExplorerTls = { // KEEP
  name: 'enable-hedera-explorer-tls',
  definition: {
    describe: 'Enable the Hedera Explorer TLS, defaults to false',
    default: false,
    type: 'boolean'
  }
}

export const hederaExplorerTlsLoadBalancerIp = {
  name: 'hedera-explorer-tls-load-balancer-ip',
  definition: {
    describe: 'The static IP address to use for the Hedera Explorer TLS load balancer, defaults to ""',
    default: '',
    type: 'string'
  }
}

export const hederaExplorerTlsHostName = {
  name: 'hedera-explorer-tls-host-name',
  definition: {
    describe: 'The host name to use for the Hedera Explorer TLS, defaults to "explorer.fst.local"',
    default: 'explorer.fst.local',
    type: 'string'
  }
}

export const deletePvcs = {
  name: 'delete-pvcs',
  definition: {
    describe: 'Delete the persistent volume claims, defaults to false',
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
  enablePrometheusSvcMonitor,
  deployMinio,
  deployCertManager,
  deployCertManagerCrds,
  releaseTag,
  relayReleaseTag,
  cacheDir,
  nodeIDs,
  chartDirectory,
  replicaCount,
  chainId,
  operatorId,
  operatorKey,
  generateGossipKeys,
  generateTlsKeys,
  enableTls,
  enableHederaExplorerTls,
  deletePvcs,
  keyFormat,
  tlsClusterIssuerType,
  enableHederaExplorerTls,
  hederaExplorerTlsLoadBalancerIp,
  hederaExplorerTlsHostName,
  deletePvcs
]
