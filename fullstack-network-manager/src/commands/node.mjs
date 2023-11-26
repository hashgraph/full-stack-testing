import { ListrEnquirerPromptAdapter } from '@listr2/prompt-adapter-enquirer'
import { BaseCommand } from './base.mjs'
import * as flags from './flags.mjs'
import {
  FullstackTestingError,
  IllegalArgumentError
} from '../core/errors.mjs'
import { constants, Templates } from '../core/index.mjs'
import chalk from 'chalk'
import * as fs from 'fs'
import { Listr } from 'listr2'

/**
 * Defines the core functionalities of 'node' command
 */
export class NodeCommand extends BaseCommand {
  constructor (opts) {
    super(opts)

    if (!opts || !opts.downloader) throw new IllegalArgumentError('An instance of core/PackageDowner is required', opts.downloader)
    if (!opts || !opts.platformInstaller) throw new IllegalArgumentError('An instance of core/PlatformInstaller is required', opts.platformInstaller)

    this.downloader = opts.downloader
    this.plaformInstaller = opts.platformInstaller
  }

  async checkNetworkNodePod (namespace, nodeId, timeout = '300s') {
    nodeId = nodeId.trim()
    const podName = Templates.renderNetworkPodName(nodeId)

    try {
      await this.kubectl.wait('pod',
        '--for=jsonpath=\'{.status.phase}\'=Running',
        '-l fullstack.hedera.com/type=network-node',
        `-l fullstack.hedera.com/node-name=${nodeId}`,
        '--timeout=300s',
        `-n "${namespace}"`
      )

      return podName
    } catch (e) {
      throw new FullstackTestingError(`failed to detect pod for node: ${nodeId}`, e)
    }
  }

  async setup (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          const config = {
            namespace: argv.namespace,
            releaseTag: argv.releaseTag,
            cacheDir: argv.cacheDir,
            force: argv.force,
            chainId: argv.chainId,
            nodeIds: []
          }

          if (argv.nodeIds) {
            const items = argv.nodeIds.split(',')
            items.forEach(item => {
              const nodeId = item.trim()
              if (nodeId) {
                config.nodeIds.push(nodeId)
              }
            })
          }

          if (!config.namespace) {
            const namespaces = await self.kubectl.getNamespace('--no-headers', '-o name')
            const initial = namespaces.indexOf(`namespace/${constants.NAMESPACE_NAME}`)
            const namespace = await task.prompt(ListrEnquirerPromptAdapter).run({
              type: 'select',
              initial,
              message: 'Which namespace do you wish to use?',
              choices: namespaces
            })

            config.namespace = namespace.replace('namespace/', '')
          }

          if (!config.nodeIds || config.nodeIds.length <= 0) {
            const nodeIds = await task.prompt(ListrEnquirerPromptAdapter).run({
              type: 'input',
              default: 'node0,node1,node2',
              message: 'Which nodes do you wish to setup? Use comma separated list:'
            })

            nodeIds.split(',').forEach(item => {
              const nodeId = item.trim()
              if (nodeId) {
                config.nodeIds.push(nodeId)
              }
            })
          }

          if (!config.releaseTag) {
            config.releaseTag = await task.prompt(ListrEnquirerPromptAdapter).run({
              type: 'text',
              default: 'v0.42.5',
              message: 'Which platform version do you wish to setup?'
            })
          }

          if (!config.cacheDir) {
            config.cacheDir = await task.prompt(ListrEnquirerPromptAdapter).run({
              type: 'text',
              default: constants.FST_CACHE_DIR,
              message: 'Which directory do you wish to use as local cache?'
            })
          }

          // compute other config parameters
          config.releasePrefix = Templates.prepareReleasePrefix(config.releaseTag)
          config.buildZipFile = `${config.cacheDir}/${config.releasePrefix}/build-${config.releaseTag}.zip`
          config.stagingDir = `${config.cacheDir}/${config.releasePrefix}/staging/${config.releaseTag}`

          // prepare staging directory
          fs.mkdirSync(config.stagingDir, { recursive: true })

          // set config in the context for later tasks to use
          ctx.config = config
          self.logger.debug('Setup config', { config })
        }
      },
      {
        title: 'Fetch platform',
        task: async (ctx) => {
          const config = ctx.config
          if (config.force || !fs.existsSync(config.buildZipFile)) {
            ctx.config.buildZipFile = await self.downloader.fetchPlatform(ctx.config.releaseTag, config.cacheDir)
          }
        }
      },
      {
        title: 'Identify network pods',
        task: async (ctx, task) => {
          ctx.config.podNames = []

          const subTasks = []
          for (const nodeId of ctx.config.nodeIds) {
            subTasks.push({
              title: `Check network pod: ${chalk.yellow(nodeId)}`,
              task: async () => {
                const podName = await self.checkNetworkNodePod(ctx.config.namespace, nodeId)
                ctx.config.podNames.push(podName)
              }
            })
          }

          // setup the sub-tasks
          return task.newListr(subTasks, {
            concurrent: true,
            rendererOptions: {
              collapseSubtasks: false
            }
          })
        }
      },
      {
        title: 'Prepare artifacts',
        task: async (ctx, task) => {
          const config = ctx.config
          await this.plaformInstaller.prepareStaging(config.nodeIds, config.stagingDir, config.releaseTag, config.force, config.chainId)
        }
      },
      {
        title: 'Setup network nodes',
        task: async (ctx, task) => {
          const config = ctx.config

          const subTasks = []
          for (const podName of config.podNames) {
            const nodeId = Templates.extractNodeIdFromPodName(podName)
            subTasks.push({
              title: `Setup node: ${chalk.yellow(nodeId)}`,
              task: () =>
                self.plaformInstaller.setupInstallTasks(podName, config.buildZipFile, config.stagingDir, config.force)
            })
          }

          // setup the sub-tasks
          return task.newListr(subTasks, {
            concurrent: true,
            rendererOptions: {
              collapseSubtasks: false
            }
          })
        }
      }
    ], {
      concurrent: false
    })

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error in setting up nodes', e)
    }

    return true
  }

  async start (argv) {
    const self = this

    try {
      const namespace = argv.namespace
      const nodeIDsArg = argv.nodeIds ? argv.nodeIds.split(',') : []
      const { podNames } = await this.checkNetworkNodePods(namespace, nodeIDsArg)
      for (const podName of podNames) {
        self.logger.showUser(chalk.cyan('>>'), `Starting node ${podName}`)
        await self.kubectl.execContainer(podName, constants.ROOT_CONTAINER, 'systemctl restart network-node')
        self.logger.showUser(chalk.green('OK'), `Started node ${podName}`)
      }

      return true
    } catch (e) {
      self.logger.showUserError(e)
    }

    return false
  }

  async stop (argv) {
    const self = this

    try {
      const namespace = argv.namespace
      const nodeIDsArg = argv.nodeIds ? argv.nodeIds.split(',') : []
      const { podNames } = await this.checkNetworkNodePods(namespace, nodeIDsArg)
      for (const podName of podNames) {
        self.logger.showUser(chalk.cyan('>>'), `Stopping node ${podName}`)
        await self.kubectl.execContainer(podName, constants.ROOT_CONTAINER, 'systemctl restart network-node')
        self.logger.showUser(chalk.green('OK'), `Stopped node ${podName}`)
      }

      return true
    } catch (e) {
      self.logger.showUserError(e)
    }

    return false
  }

  /**
   * Return Yargs command definition for 'node' command
   * @param nodeCmd an instance of NodeCommand
   */
  static getCommandDefinition (nodeCmd) {
    return {
      command: 'node',
      desc: 'Manage a FST node running Hedera platform',
      builder: yargs => {
        return yargs
          .command({
            command: 'setup',
            desc: 'Setup node with a specific version of Hedera platform',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.nodeIDs,
              flags.releaseTag,
              flags.cacheDir,
              flags.force,
              flags.chainId
            ),
            handler: argv => {
              nodeCmd.logger.debug("==== Running 'node setup' ===")
              nodeCmd.logger.debug(argv)

              nodeCmd.setup(argv).then(r => {
                nodeCmd.logger.debug('==== Finished running `node setup`====')
                if (!r) process.exit(1)
              }).catch(err => {
                nodeCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'start',
            desc: 'Start a node running Hedera platform',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.nodeIDs
            ),
            handler: argv => {
              console.log('here')
              nodeCmd.logger.debug("==== Running 'node start' ===")
              nodeCmd.logger.debug(argv)

              nodeCmd.start(argv).then(r => {
                nodeCmd.logger.debug('==== Finished running `node start`====')
                if (!r) process.exit(1)
              }).catch(err => {
                nodeCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'stop',
            desc: 'stop a node running Hedera platform',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.nodeIDs
            ),
            handler: argv => {
              nodeCmd.logger.debug("==== Running 'node stop' ===")
              nodeCmd.logger.debug(argv)

              nodeCmd.stop(argv).then(r => {
                nodeCmd.logger.debug('==== Finished running `node stop`====')
                if (!r) process.exit(1)
              }).catch(err => {
                nodeCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .demandCommand(1, 'Select a node command')
      }
    }
  }
}
