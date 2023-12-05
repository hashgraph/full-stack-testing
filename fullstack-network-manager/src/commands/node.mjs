import chalk from 'chalk'
import * as fs from 'fs'
import {Listr} from 'listr2'
import {FullstackTestingError, IllegalArgumentError} from '../core/errors.mjs'
import {constants, Templates} from '../core/index.mjs'
import {BaseCommand} from './base.mjs'
import * as flags from './flags.mjs'
import * as prompts from './prompts.mjs'
import {
  Wallet, LocalProvider, PrivateKey, AccountCreateTransaction, Hbar, Client, AccountBalanceQuery
} from '@hashgraph/sdk'

/**
 * Defines the core functionalities of 'node' command
 */
export class NodeCommand extends BaseCommand {
  constructor(opts) {
    super(opts)

    if (!opts || !opts.downloader) throw new IllegalArgumentError('An instance of core/PackageDowner is required', opts.downloader)
    if (!opts || !opts.platformInstaller) throw new IllegalArgumentError('An instance of core/PlatformInstaller is required', opts.platformInstaller)

    this.downloader = opts.downloader
    this.plaformInstaller = opts.platformInstaller
  }

  async checkNetworkNodePod(namespace, nodeId, timeout = '300s') {
    nodeId = nodeId.trim()
    const podName = Templates.renderNetworkPodName(nodeId)

    try {
      await this.kubectl.wait('pod', '--for=jsonpath=\'{.status.phase}\'=Running', '-l fullstack.hedera.com/type=network-node', `-l fullstack.hedera.com/node-name=${nodeId}`, '--timeout=300s', `-n "${namespace}"`)

      return podName
    } catch (e) {
      throw new FullstackTestingError(`no pod found for nodeId: ${nodeId}`, e)
    }
  }

  async createTestAccount(nodeId, accountKey) {
    const nodeSvc = Templates.renderNodeSvcName(nodeId)
    // await this.kubectl.portForward(`svc/${nodeSvc}`, 50211, 50211)
    const client = Client.forNetwork({'127.0.0.0:50211': '0.0.3'})

    const wallet = new Wallet(
      constants.OPERATOR_ID,
      constants.OPERATOR_KEY,
      new LocalProvider({client})
    )

    // self.logger.debug(`Test account public key = ${accountKey.publicKey.toString()}`)

    // Create a new account with 0 balance
    try {
      let transaction = await new AccountCreateTransaction()
        .setInitialBalance(new Hbar(0))
        .setKey(accountKey.publicKey)
        .freezeWithSigner(wallet)

      transaction = await transaction.signWithSigner(wallet)
      const response = await transaction.executeWithSigner(wallet)
      const receipt = await response.getReceiptWithSigner(wallet)

      const balance = await new AccountBalanceQuery()
        .setAccountId(wallet.getAccountId())
        .executeWithSigner(wallet);

      self.logger.showUserError(
        `Created new account using node '${nodeId}': ${receipt.accountId.toString()}`
      )
      self.logger.showUserError(
        `Account balance: ${balance}`
      )

      // // stop port-forward
      // try {
      //   await this.run(`pkill kubectl -9`)
      // } catch (e) {
      //   this.logger.warn('failed to stop port-forwarding', e)
      // }

      return {wallet: wallet, receipt: receipt}
    } catch (e) {
      throw new FullstackTestingError(
        `failed to create account using node: ${nodeId}`, e)
    }
  }

  async checkNetworkNode(nodeId) {
    try {
      const accountKey = PrivateKey.generate()
      await this.createTestAccount(nodeId, accountKey)
    } catch (e) {
      throw new FullstackTestingError(
        `failed to check network node '${nodeId}'`


        , e)
    }
  }

  /**
   * Return task for checking for all network node pods
   */
  taskCheckNetworkNodePods(ctx, task) {
    if (!ctx.config) {
      ctx.config = {}
    }

    ctx.config.podNames = {}

    const subTasks = []
    for (const nodeId of ctx.config.nodeIds) {
      subTasks.push({
        title:


          `
    Check
    network
    pod: ${chalk.yellow(nodeId)}`


        ,
        task: async (ctx) => {
          ctx.config.podNames[nodeId] = await this.checkNetworkNodePod(ctx.config.namespace, nodeId)
        }
      })
    }

    // set up the sub-tasks
    return task.newListr(subTasks, {
      concurrent: true,
      rendererOptions: {
        collapseSubtasks: false
      }
    })
  }

  async setup(argv) {
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
            config.buildZipFile = `${config.cacheDir} /${config.releasePrefix}/build-${config.releaseTag}.zip`
            config.stagingDir = `${config.cacheDir}/${config.releasePrefix}/staging/${config.releaseTag}`

            // prepare staging directory
            fs.mkdirSync(config.stagingDir, {recursive: true})

            // set config in the context for later tasks to use
            ctx.config = config
            self.logger.debug('Initialized config', {config})
          }
        },
        {
          title: 'Fetch platform',
          task: async (ctx, _) => {
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
          task:
            async (ctx, task) => {
              const config = ctx.config
              return self.plaformInstaller.taskPrepareStaging(config.nodeIds, config.stagingDir, config.releaseTag, config.force, config.chainId)
            }
        },
        {
          title: 'Setup network nodes',
          task:
            async (ctx, task) => {
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

              // set up the sub-tasks
              return task.newListr(subTasks, {
                concurrent: true,
                rendererOptions: {
                  collapseSubtasks: false
                }
              })
            }
        },
      ],
      {
        concurrent: false,
        showErrorMessage:
          false
      }
    )

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error in setting up nodes', e)
    }

    return true
  }

  async start(argv) {
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
              title: `
    Start
    node: ${chalk.yellow(nodeId)}`,
              task: () => self.kubectl.execContainer(podName, constants.ROOT_CONTAINER, 'systemctl restart network-node')
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
        title: 'Check network',
        task: async (ctx, task) => {

          for (const nodeId of ctx.config.nodeIds) {
            await self.checkNetworkNode(nodeId)
          }
        }
      }
    ], {concurrent: false})

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error starting node', e)
    }

    return true
  }

  async stop(argv) {
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
              title: `
    Stop
    node: ${chalk.yellow(nodeId)}`,
              task: () => self.kubectl.execContainer(podName, constants.ROOT_CONTAINER, 'systemctl stop network-node')
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
    ], {concurrent: false})

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error starting node', e)
    }

    return true
  }

  /**
   * Return Yargs command definition for 'node' command
   * @param nodeCmd an instance of NodeCommand
   */
  static getCommandDefinition(nodeCmd) {
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
                nodeCmd.logger.debug('==== Finished running  node start`====')
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
                nodeCmd.logger.debug('==== Finished running node stop`====')
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
