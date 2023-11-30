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
        message: 'Which nodes do you wish to setup? Use comma separated list:'
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
        default: 'v0.42.5',
        message: 'Which platform version do you wish to setup?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.releaseTag.name}`, e)
  }
}

export async function promptCacheDir (task, input) {
  try {
    if (!input) {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'text',
        default: constants.FST_CACHE_DIR,
        message: 'Which directory do you wish to use as local cache?'
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
        message: 'Which chain ID do you wish to use?'
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
        message: 'Which charts directory do you wish to use?'
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
        message: 'Which values.yaml file do you wish to use?'
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

export async function promptDeployCertManagerCRDs (task, input) {
  try {
    if (typeof input !== 'boolean') {
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'toggle',
        default: flags.deployCertManagerCRDs.definition.default,
        message: 'Would you like to deploy Cert Manager CRDs?'
      })
    }

    return input
  } catch (e) {
    throw new FullstackTestingError(`input failed: ${flags.deployCertManagerCRDs.name}`, e)
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
