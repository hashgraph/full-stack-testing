import chalk from 'chalk'
import * as fs from 'fs'
import { Listr } from 'listr2'
import path from 'path'
import { FullstackTestingError, IllegalArgumentError } from '../core/errors.mjs'
import { constants, Templates } from '../core/index.mjs'
import { BaseCommand } from './base.mjs'
import * as flags from './flags.mjs'
import * as prompts from './prompts.mjs'

/**
 * Defines the core functionalities of 'node' command
 */
export class NodeCommand extends BaseCommand {
  constructor (opts) {
    super(opts)

    if (!opts || !opts.downloader) throw new IllegalArgumentError('An instance of core/PackageDowner is required', opts.downloader)
    if (!opts || !opts.platformInstaller) throw new IllegalArgumentError('An instance of core/PlatformInstaller is required', opts.platformInstaller)
    if (!opts || !opts.keyManager) throw new IllegalArgumentError('An instance of core/KeyManager is required', opts.keyManager)

    this.downloader = opts.downloader
    this.plaformInstaller = opts.platformInstaller
    this.keyManager = opts.keyManager
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
      throw new FullstackTestingError(`no pod found for nodeId: ${nodeId}`, e)
    }
  }

  /**
   * Return task for checking for all network node pods
   */
  taskCheckNetworkNodePods (ctx, task) {
    if (!ctx.config) {
      ctx.config = {}
    }

    ctx.config.podNames = {}

    const subTasks = []
    for (const nodeId of ctx.config.nodeIds) {
      subTasks.push({
        title: `Check network pod: ${chalk.yellow(nodeId)}`,
        task: async (ctx) => {
          ctx.config.podNames[nodeId] = await this.checkNetworkNodePod(ctx.config.namespace, nodeId)
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

  async setup (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          const config = {
            namespace: await prompts.promptNamespaceArg(task, argv.namespace),
            nodeIds: await prompts.promptNodeIdsArg(task, argv.nodeIds),
            releaseTag: await prompts.promptReleaseTag(task, argv.releaseTag),
            cacheDir: await prompts.promptCacheDir(task, argv.cacheDir),
            force: await prompts.promptForce(task, argv.force),
            chainId: await prompts.promptChainId(task, argv.chainId)
          }

          // compute other config parameters
          config.releasePrefix = Templates.prepareReleasePrefix(config.releaseTag)
          config.buildZipFile = `${config.cacheDir}/${config.releasePrefix}/build-${config.releaseTag}.zip`
          config.stagingDir = `${config.cacheDir}/${config.releasePrefix}/staging/${config.releaseTag}`

          // prepare staging directory
          fs.mkdirSync(config.stagingDir, { recursive: true })

          // set config in the context for later tasks to use
          ctx.config = config
          self.logger.debug('Initialized config', { config })
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
        task: (ctx, task) => self.taskCheckNetworkNodePods(ctx, task)
      },
      {
        title: 'Prepare staging',
        task: async (ctx, task) => {
          const config = ctx.config
          return self.plaformInstaller.taskPrepareStaging(config.nodeIds, config.stagingDir, config.releaseTag, config.force, config.chainId)
        }
      },
      {
        title: 'Setup network nodes',
        task: async (ctx, task) => {
          const config = ctx.config

          const subTasks = []
          for (const nodeId of ctx.config.nodeIds) {
            const podName = ctx.config.podNames[nodeId]
            subTasks.push({
              title: `Setup node: ${chalk.yellow(nodeId)}`,
              task: () =>
                self.plaformInstaller.taskInstall(podName, config.buildZipFile, config.stagingDir, config.force)
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
      concurrent: false,
      rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
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

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          ctx.config = {
            namespace: await prompts.promptNamespaceArg(task, argv.namespace),
            nodeIds: await prompts.promptNodeIdsArg(task, argv.nodeIds)
          }
        }
      },
      {
        title: 'Identify network pods',
        task: (ctx, task) => self.taskCheckNetworkNodePods(ctx, task)
      },
      {
        title: 'Starting nodes',
        task: (ctx, task) => {
          const subTasks = []
          for (const nodeId of ctx.config.nodeIds) {
            const podName = ctx.config.podNames[nodeId]
            subTasks.push({
              title: `Start node: ${chalk.yellow(nodeId)}`,
              task: () => self.kubectl.execContainer(podName, constants.ROOT_CONTAINER, 'systemctl restart network-node')
            })
          }

          // setup the sub-tasks
          return task.newListr(subTasks, {
            concurrent: true,
            rendererOptions: {
              collapseSubtasks: false,
              timer: constants.LISTR_DEFAULT_RENDERER_TIMER_OPTION
            }
          })
        }
      }
    ], {
      concurrent: false,
      rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
    })

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error starting node', e)
    }

    return true
  }

  async stop (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          ctx.config = {
            namespace: await prompts.promptNamespaceArg(task, argv.namespace),
            nodeIds: await prompts.promptNodeIdsArg(task, argv.nodeIds)
          }
        }
      },
      {
        title: 'Identify network pods',
        task: (ctx, task) => self.taskCheckNetworkNodePods(ctx, task)
      },
      {
        title: 'Stopping nodes',
        task: (ctx, task) => {
          const subTasks = []
          for (const nodeId of ctx.config.nodeIds) {
            const podName = ctx.config.podNames[nodeId]
            subTasks.push({
              title: `Stop node: ${chalk.yellow(nodeId)}`,
              task: () => self.kubectl.execContainer(podName, constants.ROOT_CONTAINER, 'systemctl stop network-node')
            })
          }

          // setup the sub-tasks
          return task.newListr(subTasks, {
            concurrent: true,
            rendererOptions: {
              collapseSubtasks: false,
              timer: constants.LISTR_DEFAULT_RENDERER_TIMER_OPTION
            }
          })
        }
      }
    ], {
      concurrent: false,
      rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
    })

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error starting node', e)
    }

    return true
  }

  async keys (argv) {
    const self = this
    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          ctx.config = {
            nodeIds: await prompts.promptNodeIdsArg(task, argv.nodeIds),
            cacheDir: await prompts.promptCacheDir(task, argv.cacheDir),
            keyType: await prompts.promptKeyType(task, argv.keyType)
          }
        }
      },
      {
        title: 'Generate keys',
        task: async (ctx, task) => {
          const keyDir = path.join(ctx.config.cacheDir, 'keys')
          if (!fs.existsSync(keyDir)) {
            fs.mkdirSync(keyDir)
          }

          const nodeKeyFiles = new Map()
          if (ctx.config.keyType === constants.KEY_TYPE_GOSSIP) {
            for (const nodeId of ctx.config.nodeIds) {
              const signingKey = await this.keyManager.generateNodeSigningKey(nodeId)
              const signingKeyFiles = await this.keyManager.storeSigningKey(nodeId, signingKey, keyDir)
              const agreementKeys = await this.keyManager.generateAgreementKey(nodeId, signingKey)
              const agreementKeyFiles = await this.keyManager.storeAgreementKey(nodeId, agreementKeys, keyDir)
              nodeKeyFiles.set(nodeId, {
                signingKeyFiles,
                agreementKeyFiles
              })
            }

            self.logger.showUser(chalk.green('*** Generated Node Gossip Keys ***'))
            for (const entry of nodeKeyFiles.entries()) {
              const nodeId = entry[0]
              const fileList = entry[1]
              self.logger.showUser(chalk.cyan('---------------------------------------------------------------------------------------------'))
              self.logger.showUser(chalk.cyan(`Node ID: ${nodeId}`))
              self.logger.showUser(chalk.cyan('==========================='))
              self.logger.showUser(chalk.green('Signing key\t\t:'), chalk.yellow(fileList.signingKeyFiles.privateKeyFile))
              self.logger.showUser(chalk.green('Signing certificate\t:'), chalk.yellow(fileList.signingKeyFiles.certificateFile))
              self.logger.showUser(chalk.green('Agreement key\t\t:'), chalk.yellow(fileList.agreementKeyFiles.privateKeyFile))
              self.logger.showUser(chalk.green('Agreement certificate\t:'), chalk.yellow(fileList.agreementKeyFiles.certificateFile))
              self.logger.showUser(chalk.blue('Inspect certificate\t: '), chalk.yellow(`openssl storeutl -noout -text -certs ${fileList.agreementKeyFiles.certificateFile}`))
              self.logger.showUser(chalk.blue('Verify certificate\t: '), chalk.yellow(`openssl verify -CAfile ${fileList.signingKeyFiles.certificateFile} ${fileList.agreementKeyFiles.certificateFile}`))
            }
            self.logger.showUser(chalk.cyan('---------------------------------------------------------------------------------------------'))
          } else {
            throw new FullstackTestingError(`unsupported key type: ${ctx.config.keyType}`)
          }
        }
      }
    ])

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError(`Error generating keys: ${e.message}`, e)
    }

    return true
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
            desc: 'Stop a node running Hedera platform',
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
          .command({
            command: 'keys',
            desc: 'Generate node keys',
            builder: y => flags.setCommandFlags(y,
              flags.keyType,
              flags.nodeIDs,
              flags.cacheDir
            ),
            handler: argv => {
              nodeCmd.logger.debug("==== Running 'node keys' ===")
              nodeCmd.logger.debug(argv)

              nodeCmd.keys(argv).then(r => {
                nodeCmd.logger.debug('==== Finished running `node keys`====')
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
