import { ListrEnquirerPromptAdapter } from '@listr2/prompt-adapter-enquirer'
import fs from 'fs'
import { FullstackTestingError, IllegalArgumentError } from '../core/errors.mjs'
import { constants } from '../core/index.mjs'
import * as flags from './flags.mjs'

export async function promptNamespaceArg (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.namespace.definition.default,
        message: 'Enter namespace name: '
      })
    }

    return input.replace('namespace/', '')
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.namespace.name}`, e)
  }
}

export async function promptSelectNamespaceArg (task, input, choices = []) {
  try {
    const initial = choices.indexOf(`namespace/${input}`)
    if (initial < 0) {
      const input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'select',
        initial,
        message: 'Which namespace do you wish to use?',
        choices
      })

      return input.replace('namespace/', '')
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.namespace.name}`, e)
  }
}

export async function promptNodeIdsArg (task, input) {
  try {
    let nodeIds = []
    if (!input) {
      nodeIds = []
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'input',
        default: 'node0,node1,node2',
        message: 'Enter list of node IDs (comma separated list):'
      })
    }

    if (input) {
      input.split(',').forEach(item => {
        const nodeId = item.trim()
        if (nodeId) {
          nodeIds.push(nodeId)
        }
      })
    }

    return nodeIds
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.nodeIDs.name}`, e)
  }
}

export async function promptReleaseTag (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.releaseTag.definition.default,
        message: 'Enter release version:'
      })

      if (!input) throw new IllegalArgumentError('release tag cannot be empty')
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed for '${flags.releaseTag.name}': ${e.message}`, e)
  }
}

export async function promptCacheDir (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: constants.FST_CACHE_DIR,
        message: 'Enter local cache directory path:'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.cacheDir.name}`, e)
  }
}

export async function promptForce (task, input) {
  try {
    if (input === undefined) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.force.definition.default,
        message: 'Would you like to force changes?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.force.name}`, e)
  }
}

export async function promptChainId (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.chainId.definition.default,
        message: 'Enter chain ID: '
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.chainId.name}`, e)
  }
}

export async function promptChartDir (task, input) {
  try {
    if (input && !fs.existsSync(input)) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.chartDirectory.definition.default,
        message: 'Enter local charts directory path: '
      })

      if (!fs.existsSync(input)) {
        throw new IllegalArgumentError('Invalid chart directory', input)
      }
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.chartDirectory.name}`, e)
  }
}

export async function promptValuesFile (task, input) {
  try {
    if (input && !fs.existsSync(input)) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.valuesFile.definition.default,
        message: 'Enter path to values.yaml: '
      })

      if (!fs.existsSync(input)) {
        throw new IllegalArgumentError('Invalid values.yaml file', input)
      }
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.valuesFile.name}`, e)
  }
}

export async function promptClusterNameArg (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.clusterName.definition.default,
        message: 'Enter cluster name: '
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.clusterName.name}`, e)
  }
}

export async function promptSelectClusterNameArg (task, input, choices = []) {
  try {
    const initial = choices.indexOf(input)
    if (initial < 0) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'select',
        initial,
        message: 'Select cluster',
        choices
      })
      return input.replace('namespace/', '')
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.clusterName.name}`, e)
  }
}

export async function promptDeployPrometheusStack (task, input) {
  try {
    if (input === undefined) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.deployPrometheusStack.definition.default,
        message: 'Would you like to deploy prometheus stack?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployPrometheusStack.name}`, e)
  }
}

export async function promptDeployMinio (task, input) {
  try {
    if (input === undefined) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.deployMinio.definition.default,
        message: 'Would you like to deploy MinIO?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployMinio.name}`, e)
  }
}

export async function promptDeployEnvoyGateway (task, input) {
  try {
    if (input === undefined) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.deployEnvoyGateway.definition.default,
        message: 'Would you like to deploy Envoy Gateway?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployEnvoyGateway.name}`, e)
  }
}

export async function promptDeployCertManager (task, input) {
  try {
    if (typeof input !== 'boolean') {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.deployCertManager.definition.default,
        message: 'Would you like to deploy Cert Manager?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployCertManager.name}`, e)
  }
}

export async function promptDeployCertManagerCrds (task, input) {
  try {
    if (typeof input !== 'boolean') {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.deployCertManagerCrds.definition.default,
        message: 'Would you like to deploy Cert Manager CRDs?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployCertManagerCrds.name}`, e)
  }
}

export async function promptAcmeClusterIssuer (task, input) {
  try {
    if (typeof input !== 'boolean') {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.acmeClusterIssuer.definition.default,
        message: 'Would you like to deploy ACME Cluster Issuer?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.acmeClusterIssuer.name}`, e)
  }
}

export async function promptDeployMirrorNode (task, input) {
  try {
    if (input === undefined) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.deployMirrorNode.definition.default,
        message: 'Would you like to deploy Hedera Mirror Node?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployMirrorNode.name}`, e)
  }
}

export async function promptDeployHederaExplorer (task, input) {
  try {
    if (input === undefined) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.deployHederaExplorer.definition.default,
        message: 'Would you like to deploy Hedera Explorer?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployHederaExplorer.name}`, e)
  }
}

export async function promptEnableTls (task, input) {
  try {
    if (input === undefined) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.enableTls.definition.default,
        message: 'Would you like to enable TLS?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.enableTls.name}`, e)
  }
}

export async function promptTlsClusterIssuerName (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.tlsClusterIssuerName.definition.default,
        message: 'Enter TLS cluster issuer name:'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.tlsClusterIssuerName.name}`, e)
  }
}

export async function promptTlsClusterIssuerNamespace (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.tlsClusterIssuerNamespace.definition.default,
        message: 'Enter TLS cluster issuer namespace:'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.tlsClusterIssuerNamespace.name}`, e)
  }
}

export async function promptOperatorId (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.operatorId.definition.default,
        message: 'Enter operator ID: '
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.operatorId.name}`, e)
  }
}

export async function promptOperatorKey (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.operatorKey.definition.default,
        message: 'Enter operator ID: '
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.operatorKey.name}`, e)
  }
}

export async function promptReplicaCount (task, input) {
  try {
    if (typeof input !== 'number') {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'number',
        default: flags.replicaCount.definition.default,
        message: 'How many replica do you want?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.replicaCount.name}`, e)
  }
}

export async function promptKeyType (task, input) {
  try {
    const initial = 0
    const choices = [constants.KEY_TYPE_GOSSIP, constants.KEY_TYPE_TLS]
    if (!input || !choices.includes(input)) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'select',
        initial,
        message: 'Select key type',
        choices
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.chainId.name}`, e)
  }
}

export async function promptGenerateGossipKeys (task, input) {
  try {
    if (typeof input !== 'boolean') {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.generateGossipKeys.definition.default,
        message: 'Would you like to generate gossip keys?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployCertManagerCRDs.name}`, e)
  }
}

export async function promptGenerateTLSKeys (task, input) {
  try {
    if (typeof input !== 'boolean') {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.generateTlsKeys.definition.default,
        message: 'Would you like to generate TLS keys?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployCertManagerCRDs.name}`, e)
  }
}
