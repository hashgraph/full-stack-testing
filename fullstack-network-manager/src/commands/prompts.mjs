import { ListrEnquirerPromptAdapter } from '@listr2/prompt-adapter-enquirer'
import { FullstackTestingError } from '../core/errors.mjs'
import { constants } from '../core/index.mjs'
import * as flags from './flags.mjs'

export async function promptNamespaceArg (task, input) {
  try {
    if (!input) {
      const namespaces = await self.kubectl.getNamespace('--no-headers', '-o name')
      const initial = namespaces.indexOf(`namespace/${constants.NAMESPACE_NAME}`)
      input = await task.prompt(ListrEnquirerPromptAdapter).run({
        type: 'select',
        initial,
        message: 'Which namespace do you wish to use?',
        choices: namespaces
      })
    }

    return input.replace('namespace/', '')
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
