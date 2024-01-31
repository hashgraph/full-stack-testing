import { ListrEnquirerPromptAdapter } from '@listr2/prompt-adapter-enquirer'
import fs from 'fs'
import { FullstackTestingError, IllegalArgumentError } from '../core/errors.mjs'
import { constants } from '../core/index.mjs'
import * as flags from './flags.mjs'
import * as helpers from '../core/helpers.mjs'

export async function promptNamespace (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.namespace.definition.default,
        message: 'Enter namespace name: '
      })
    }

    if (!input) {
      throw new FullstackTestingError('namespace cannot be empty')
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.namespace.name}: ${e.message}`, e)
  }
}

export async function promptNodeIds (task, input) {
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

    if (!input) {
      throw new FullstackTestingError('release-tag cannot be empty')
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.releaseTag.name}`, e)
  }
}

export async function promptRelayReleaseTag (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.relayReleaseTag.definition.default,
        message: 'Enter relay release version:'
      })
    }

    if (!input) {
      throw new FullstackTestingError('relay-release-tag cannot be empty')
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
        default: constants.SOLO_CACHE_DIR,
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
    if (typeof input !== 'boolean') {
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

export async function promptEnablePrometheusSvcMonitor (task, input) {
  try {
    if (input === undefined) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.enablePrometheusSvcMonitor.definition.default,
        message: 'Would you like to enable the Prometheus service monitor for the network nodes?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.enablePrometheusSvcMonitor.name}`, e)
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

export async function promptTlsClusterIssuerType (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.tlsClusterIssuerType.definition.default,
        message: 'Enter TLS cluster issuer type, available options are: "acme-staging", "acme-prod", or "self-signed":'
      })
    }

    if (!input || !['acme-staging', 'acme-prod', 'self-signed'].includes(input)) {
      throw new FullstackTestingError('must be one of: "acme-staging", "acme-prod", or "self-signed"')
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.tlsClusterIssuerType.name}`, e)
  }
}

export async function promptEnableHederaExplorerTls (task, input) {
  try {
    if (input === undefined) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.enableHederaExplorerTls.definition.default,
        message: 'Would you like to enable the Hedera Explorer TLS?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.enableHederaExplorerTls.name}`, e)
  }
}

export async function promptHederaExplorerTlsHostName (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: flags.hederaExplorerTlsHostName.definition.default,
        message: 'Enter the host name to use for the Hedera Explorer TLS:'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.hederaExplorerTlsHostName.name}`, e)
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

export async function promptGenerateGossipKeys (task, input) {
  try {
    if (typeof input !== 'boolean') {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.generateGossipKeys.definition.default,
        message: `Would you like to generate Gossip keys? ${typeof input} ${input}`
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deletePvcs.name}`, e)
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
    throw new FullstackTestingError(`input failed: ${flags.deletePvcs.name}`, e)
  }
}

export async function promptDeletePvcs (task, input) {
  try {
    if (input === undefined) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.deletePvcs.definition.default,
        message: 'Would you like to delete persistent volume claims upon uninstall?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployCertManagerCRDs.name}`, e)
  }
}

export async function promptKeyFormat (task, input, choices = [constants.KEY_FORMAT_PFX, constants.KEY_FORMAT_PEM]) {
  try {
    const initial = choices.indexOf(input)
    if (initial < 0) {
      const input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'select',
        initial: choices.indexOf(flags.keyFormat.definition.default),
        message: 'Select key format',
        choices: helpers.cloneArray(choices)
      })

      if (!input) {
        throw new FullstackTestingError('key-format cannot be empty')
      }

      return input
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.keyFormat.name}: ${e.message}`, e)
  }
}

export function getPromptMap() {
  return new Map()
    .set(flags.nodeIDs.name, promptNodeIds)
    .set(flags.releaseTag.name, promptReleaseTag)
    .set(flags.relayReleaseTag.name, promptRelayReleaseTag)
    .set(flags.namespace.name, promptNamespace)
    .set(flags.cacheDir.name, promptCacheDir)
    .set(flags.force.name, promptForce)
    .set(flags.chainId.name, promptChainId)
    .set(flags.chartDirectory.name, promptChartDir)
    .set(flags.valuesFile.name, promptValuesFile)
    .set(flags.deployPrometheusStack.name, promptDeployPrometheusStack)
    .set(flags.enablePrometheusSvcMonitor.name, promptEnablePrometheusSvcMonitor)
    .set(flags.deployMinio.name, promptDeployMinio)
    .set(flags.deployCertManager.name, promptDeployCertManager)
    .set(flags.deployCertManagerCrds.name, promptDeployCertManagerCrds)
    .set(flags.deployMirrorNode.name, promptDeployMirrorNode)
    .set(flags.deployHederaExplorer.name, promptDeployHederaExplorer)
    .set(flags.tlsClusterIssuerType.name, promptTlsClusterIssuerType)
    .set(flags.enableHederaExplorerTls.name, promptEnableHederaExplorerTls)
    .set(flags.hederaExplorerTlsHostName.name, promptHederaExplorerTlsHostName)
    .set(flags.operatorId.name, promptOperatorId)
    .set(flags.operatorKey.name, promptOperatorKey)
    .set(flags.replicaCount.name, promptReplicaCount)
    .set(flags.generateGossipKeys.name, promptGenerateGossipKeys)
    .set(flags.generateTlsKeys.name, promptGenerateTLSKeys)
    .set(flags.deletePvcs.name, promptDeletePvcs)
    .set(flags.keyFormat.name, promptKeyFormat)
}

// build the prompt registry
/**
 * Run prompts for the given set of flags
 * @param task task object from listr2
 * @param configManager config manager to store flag values
 * @param flagList list of flag objects
 * @return {Promise<void>}
 */
export async function execute (task, configManager, flagList = []) {
  const prompts = getPromptMap()
  for (const flag of flagList) {
    if (!prompts.has(flag.name)) {
      throw new FullstackTestingError(`No prompt available for flag: ${flag.name}`)
    }

    const prompt = prompts.get(flag.name)
    const input = await prompt(task, configManager.getFlag(flag))
    configManager.setFlag(flag, input)
  }

  configManager.persist()
}