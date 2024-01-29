import chalk from 'chalk'
import * as fs from 'fs'
import { Listr } from 'listr2'
import path from 'path'
import { FullstackTestingError, IllegalArgumentError } from '../core/errors.mjs'
import { sleep } from '../core/helpers.mjs'
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

  async checkNetworkNodePod (namespace, nodeId) {
    nodeId = nodeId.trim()
    const podName = Templates.renderNetworkPodName(nodeId)

    try {
      await this.k8.waitForPod(constants.POD_STATUS_RUNNING, [
        'fullstack.hedera.com/type=network-node',
        `fullstack.hedera.com/node-name=${nodeId}`
      ], 1)

      return podName
    } catch (e) {
      throw new FullstackTestingError(`no pod found for nodeId: ${nodeId}`, e)
    }
  }

  async checkNetworkNodeStarted (nodeId, maxAttempt = 50, status = 'ACTIVE') {
    nodeId = nodeId.trim()
    const podName = Templates.renderNetworkPodName(nodeId)
    const logfilePath = `${constants.HEDERA_HAPI_PATH}/logs/hgcaa.log`
    let attempt = 0
    let isActive = false

    while (attempt < maxAttempt) {
      try {
        const output = await this.k8.execContainer(podName, constants.ROOT_CONTAINER, ['tail', '-10', logfilePath])
        if (output.indexOf(`Now current platform status = ${status}`) > 0) {
          this.logger.debug(`Node ${nodeId} is ${status} [ attempt: ${attempt}/${maxAttempt}]`)
          isActive = true
          break
        }
        this.logger.debug(`Node ${nodeId} is not ${status} yet. Trying again... [ attempt: ${attempt}/${maxAttempt} ]`)
      } catch (e) {
        this.logger.warn(`error in checking if node ${nodeId} is ${status}: ${e.message}. Trying again... [ attempt: ${attempt}/${maxAttempt} ]`)

        // ls the HAPI path for debugging
        await this.k8.execContainer(podName, constants.ROOT_CONTAINER, `ls -la ${constants.HEDERA_HAPI_PATH}`)

        // ls the logs directory for debugging
        await this.k8.execContainer(podName, constants.ROOT_CONTAINER, `ls -la ${constants.HEDERA_HAPI_PATH}/logs`)
      }
      attempt += 1
      await sleep(1000)
    }

    if (!isActive) {
      throw new FullstackTestingError(`node '${nodeId}' is not ${status} [ attempt = ${attempt}/${maxAttempt} ]`)
    }

    return true
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

  async _copyNodeKeys (nodeKey, destDir) {
    for (const keyFile of [nodeKey.privateKeyFile, nodeKey.certificateFile]) {
      if (!fs.existsSync(keyFile)) {
        throw new FullstackTestingError(`file (${keyFile}) is missing`)
      }

      const fileName = path.basename(keyFile)
      fs.cpSync(keyFile, `${destDir}/${fileName}`)
    }
  }

  async setup (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          self.configManager.load(argv)
          const namespace = self.configManager.getFlag(flags.namespace)
          const namespaces = await self.k8.getNamespaces()

          const config = {
            namespace: await prompts.promptSelectNamespaceArg(task, namespace, namespaces),
            nodeIds: await prompts.promptNodeIdsArg(task, argv[flags.nodeIDs.name]),
            releaseTag: await prompts.promptReleaseTag(task, self.configManager.getFlag(flags.releaseTag)),
            cacheDir: await prompts.promptCacheDir(task, argv[flags.cacheDir.name]),
            force: await prompts.promptForce(task, argv[flags.force.name]),
            chainId: await prompts.promptChainId(task, argv[flags.chainId.name]),
            generateGossipKeys: await prompts.promptGenerateGossipKeys(task, argv[flags.generateGossipKeys.name]),
            generateTlsKeys: await prompts.promptGenerateTLSKeys(task, argv[flags.generateTlsKeys.name]),
            keyFormat: await prompts.promptKeyFormat(task, argv[flags.keyFormat.name])
          }

          if (config.keyFormat === constants.KEY_FORMAT_PFX && config.generateGossipKeys) {
            throw new FullstackTestingError(`Unable to generate PFX gossip keys. Please ensure you have pre-generated keys in ${config.cacheDir}/keys`)
          }

          if (!await this.k8.hasNamespace(config.namespace)) {
            throw new FullstackTestingError(`namespace ${config.namespace} does not exist`)
          }

          // compute other config parameters
          config.releasePrefix = Templates.prepareReleasePrefix(config.releaseTag)
          config.buildZipFile = `${config.cacheDir}/${config.releasePrefix}/build-${config.releaseTag}.zip`
          config.keysDir = path.join(config.cacheDir, 'keys')
          config.stagingDir = `${config.cacheDir}/${config.releasePrefix}/staging/${config.releaseTag}`
          config.stagingKeysDir = path.join(config.stagingDir, 'keys')

          // prepare staging keys directory
          if (!fs.existsSync(config.stagingKeysDir)) {
            fs.mkdirSync(config.stagingKeysDir, { recursive: true })
          }

          // create cached keys dir if it does not exist yet
          if (!fs.existsSync(config.keysDir)) {
            fs.mkdirSync(config.keysDir)
          }

          // set config in the context for later tasks to use
          ctx.config = config

          self.logger.debug('Initialized config', { config })
        }
      },
      {
        title: 'Identify network pods',
        task: (ctx, task) => self.taskCheckNetworkNodePods(ctx, task)
      },
      {
        title: 'Fetch platform software',
        task: async (ctx, _) => {
          const config = ctx.config
          if (config.force || !fs.existsSync(config.buildZipFile)) {
            ctx.config.buildZipFile = await self.downloader.fetchPlatform(ctx.config.releaseTag, config.cacheDir)
          }
        }
      },
      {
        title: 'Generate Gossip keys',
        task: async (ctx, _) => {
          const config = ctx.config

          // generate gossip keys if required
          if (config.generateGossipKeys) {
            for (const nodeId of ctx.config.nodeIds) {
              const signingKey = await self.keyManager.generateSigningKey(nodeId)
              const signingKeyFiles = await self.keyManager.storeSigningKey(nodeId, signingKey, config.keysDir)
              self.logger.debug(`generated Gossip signing keys for node ${nodeId}`, { keyFiles: signingKeyFiles })

              const agreementKey = await self.keyManager.generateAgreementKey(nodeId, signingKey)
              const agreementKeyFiles = await self.keyManager.storeAgreementKey(nodeId, agreementKey, config.keysDir)
              self.logger.debug(`generated Gossip agreement keys for node ${nodeId}`, { keyFiles: agreementKeyFiles })
            }
          }
        },
        skip: (ctx, _) => !ctx.config.generateGossipKeys
      },
      {
        title: 'Generate gRPC TLS keys',
        task: async (ctx, _) => {
          const config = ctx.config
          // generate TLS keys if required
          if (config.generateTlsKeys) {
            for (const nodeId of ctx.config.nodeIds) {
              const tlsKeys = await self.keyManager.generateGrpcTLSKey(nodeId, config.keysDir)
              const tlsKeyFiles = await self.keyManager.storeTLSKey(nodeId, tlsKeys, config.keysDir)
              self.logger.debug(`generated TLS keys for node: ${nodeId}`, { keyFiles: tlsKeyFiles })
            }
          }
        },
        skip: (ctx, _) => !ctx.config.generateTlsKeys
      },
      {
        title: 'Prepare staging directory',
        task: async (ctx, parentTask) => {
          const config = ctx.config
          const subTasks = [
            {
              title: 'Copy default files and templates',
              task: () => {
                for (const item of ['properties', 'config.template', 'log4j2.xml', 'settings.txt']) {
                  fs.cpSync(`${constants.RESOURCES_DIR}/templates/${item}`, `${config.stagingDir}/templates/${item}`, { recursive: true })
                }
              }
            },
            {
              title: 'Copy Gossip keys to staging',
              task: async (ctx, _) => {
                const config = ctx.config

                // copy gossip keys to the staging
                for (const nodeId of ctx.config.nodeIds) {
                  switch (config.keyFormat) {
                    case constants.KEY_FORMAT_PEM: {
                      const signingKeyFiles = self.keyManager.prepareNodeKeyFilePaths(nodeId, config.keysDir, constants.SIGNING_KEY_PREFIX)
                      await self._copyNodeKeys(signingKeyFiles, config.stagingKeysDir)

                      // generate missing agreement keys
                      const agreementKeyFiles = self.keyManager.prepareNodeKeyFilePaths(nodeId, config.keysDir, constants.AGREEMENT_KEY_PREFIX)
                      await self._copyNodeKeys(agreementKeyFiles, config.stagingKeysDir)
                      break
                    }

                    case constants.KEY_FORMAT_PFX: {
                      const privateKeyFile = Templates.renderGossipPfxPrivateKeyFile(nodeId)
                      fs.cpSync(`${config.keysDir}/${privateKeyFile}`, `${config.stagingKeysDir}/${privateKeyFile}`)
                      fs.cpSync(`${config.keysDir}/public.pfx`, `${config.stagingKeysDir}/public.pfx`)
                      break
                    }

                    default:
                      throw new FullstackTestingError(`Unsupported key-format ${config.keyFormat}`)
                  }
                }
              }
            },
            {
              title: 'Copy gRPC TLS keys to staging',
              task: async (ctx, _) => {
                const config = ctx.config
                for (const nodeId of ctx.config.nodeIds) {
                  const tlsKeyFiles = self.keyManager.prepareTLSKeyFilePaths(nodeId, config.keysDir)
                  await self._copyNodeKeys(tlsKeyFiles, config.stagingKeysDir)
                }
              }
            },
            {
              title: 'Prepare config.txt for the network',
              task: async (ctx, _) => {
                const config = ctx.config
                const configTxtPath = `${config.stagingDir}/config.txt`
                const template = `${config.stagingDir}/templates/config.template`
                await self.plaformInstaller.prepareConfigTxt(config.nodeIds, configTxtPath, config.releaseTag, config.chainId, template)
              }
            }
          ]

          return parentTask.newListr(subTasks, {
            concurrent: false,
            rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
          })
        }
      },
      {
        title: 'Upload platform software into network nodes',
        task:
          async (ctx, task) => {
            const config = ctx.config

            const subTasks = []
            for (const nodeId of ctx.config.nodeIds) {
              const podName = ctx.config.podNames[nodeId]
              subTasks.push({
                title: `Node: ${chalk.yellow(nodeId)}`,
                task: () =>
                  self.plaformInstaller.copyPlatform(podName, config.buildZipFile)
              })
            }

            // set up the sub-tasks
            return task.newListr(subTasks, {
              concurrent: false, // parallel uploading of the zip file seems to be unreliable, so we just upload in sequence
              rendererOptions: {
                collapseSubtasks: false
              }
            })
          }
      },
      {
        title: 'Setup network nodes',
        task: async (ctx, parentTask) => {
          const config = ctx.config

          const subTasks = []
          for (const nodeId of ctx.config.nodeIds) {
            const podName = ctx.config.podNames[nodeId]
            subTasks.push({
              title: `Node: ${chalk.yellow(nodeId)}`,
              task: () =>
                self.plaformInstaller.taskInstall(podName, config.buildZipFile, config.stagingDir, config.keyFormat, config.force)
            })
          }

          // set up the sub-tasks
          return parentTask.newListr(subTasks, {
            concurrent: true,
            rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
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
      throw new FullstackTestingError(`Error in setting up nodes: ${e.message}`, e)
    }

    return true
  }

  async start (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          self.configManager.load(argv)

          const namespace = self.configManager.getFlag(flags.namespace)
          const namespaces = await self.k8.getNamespaces()

          ctx.config = {
            namespace: await prompts.promptSelectNamespaceArg(task, namespace, namespaces),
            nodeIds: await prompts.promptNodeIdsArg(task, argv[flags.nodeIDs.name])
          }

          if (!await this.k8.hasNamespace(ctx.config.namespace)) {
            throw new FullstackTestingError(`namespace ${ctx.config.namespace} does not exist`)
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
              task: async () => {
                await self.k8.execContainer(podName, constants.ROOT_CONTAINER, ['rm', '-rf', `${constants.HEDERA_HAPI_PATH}/data/logs/*.log`])
                await self.k8.execContainer(podName, constants.ROOT_CONTAINER, ['systemctl', 'restart', 'network-node'])
              }
            })
          }

          // set up the sub-tasks
          return task.newListr(subTasks, {
            concurrent: true,
            rendererOptions: {
              collapseSubtasks: false,
              timer: constants.LISTR_DEFAULT_RENDERER_TIMER_OPTION
            }
          })
        }
      },
      {
        title: 'Check nodes are ACTIVE',
        task: (ctx, task) => {
          const subTasks = []
          for (const nodeId of ctx.config.nodeIds) {
            subTasks.push({
              title: `Check node: ${chalk.yellow(nodeId)}`,
              task: () => self.checkNetworkNodeStarted(nodeId)
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
          self.configManager.load(argv)
          const namespace = self.configManager.getFlag(flags.namespace)

          // get existing choices
          const namespaces = await self.k8.getNamespaces()
          ctx.config = {
            namespace: await prompts.promptSelectNamespaceArg(task, namespace, namespaces),
            nodeIds: await prompts.promptNodeIdsArg(task, argv.nodeIds)
          }

          if (!await this.k8.hasNamespace(ctx.config.namespace)) {
            throw new FullstackTestingError(`namespace ${ctx.config.namespace} does not exist`)
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
              task: () => self.k8.execContainer(podName, constants.ROOT_CONTAINER, 'systemctl stop network-node')
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
            generateGossipKeys: await prompts.promptGenerateGossipKeys(task, argv.generateGossipKeys),
            generateTlsKeys: await prompts.promptGenerateTLSKeys(task, argv.generateTlsKeys)
          }

          const keysDir = path.join(ctx.config.cacheDir, 'keys')
          if (!fs.existsSync(keysDir)) {
            fs.mkdirSync(keysDir)
          }

          ctx.config.keysDir = keysDir
        }
      },
      {
        title: 'Generate gossip keys',
        task: async (ctx, task) => {
          const keysDir = ctx.config.keysDir
          const nodeKeyFiles = new Map()
          if (ctx.config.generateGossipKeys) {
            for (const nodeId of ctx.config.nodeIds) {
              const signingKey = await self.keyManager.generateNodeSigningKey(nodeId)
              const signingKeyFiles = await self.keyManager.storeSigningKey(nodeId, signingKey, keysDir)
              const agreementKey = await self.keyManager.generateAgreementKey(nodeId, signingKey)
              const agreementKeyFiles = await self.keyManager.storeAgreementKey(nodeId, agreementKey, keysDir)
              nodeKeyFiles.set(nodeId, {
                signingKey,
                agreementKey,
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
          }
        },
        skip: (ctx, _) => !ctx.config.generateGossipKeys
      },
      {
        title: 'Generate gRPC TLS keys',
        task: async (ctx, task) => {
          const keysDir = ctx.config.keysDir
          const nodeKeyFiles = new Map()
          if (ctx.config.generateTlsKeys) {
            for (const nodeId of ctx.config.nodeIds) {
              const tlsKey = await self.keyManager.generateGrpcTLSKey(nodeId)
              const tlsKeyFiles = await self.keyManager.storeTLSKey(nodeId, tlsKey, keysDir)
              nodeKeyFiles.set(nodeId, {
                tlsKeyFiles
              })
            }

            self.logger.showUser(chalk.green('*** Generated Node TLS Keys ***'))
            for (const entry of nodeKeyFiles.entries()) {
              const nodeId = entry[0]
              const fileList = entry[1]
              self.logger.showUser(chalk.cyan('---------------------------------------------------------------------------------------------'))
              self.logger.showUser(chalk.cyan(`Node ID: ${nodeId}`))
              self.logger.showUser(chalk.cyan('==========================='))
              self.logger.showUser(chalk.green('TLS key\t\t:'), chalk.yellow(fileList.tlsKeyFiles.privateKeyFile))
              self.logger.showUser(chalk.green('TLS certificate\t:'), chalk.yellow(fileList.tlsKeyFiles.certificateFile))
              self.logger.showUser(chalk.blue('Inspect certificate\t: '), chalk.yellow(`openssl storeutl -noout -text -certs ${fileList.tlsKeyFiles.certificateFile}`))
              self.logger.showUser(chalk.blue('Verify certificate\t: '), chalk.yellow(`openssl verify -CAfile ${fileList.tlsKeyFiles.certificateFile} ${fileList.tlsKeyFiles.certificateFile}`))
            }
            self.logger.showUser(chalk.cyan('---------------------------------------------------------------------------------------------'))
          }
        },
        skip: (ctx, _) => !ctx.config.generateTlsKeys
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
      desc: 'Manage Hedera platform node in fullstack testing network',
      builder: yargs => {
        return yargs
          .command({
            command: 'setup',
            desc: 'Setup node with a specific version of Hedera platform',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.nodeIDs,
              flags.releaseTag,
              flags.generateGossipKeys,
              flags.generateTlsKeys,
              flags.cacheDir,
              flags.chainId,
              flags.force
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
            desc: 'Start a node',
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
            desc: 'Stop a node',
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
              flags.nodeIDs,
              flags.cacheDir,
              flags.generateGossipKeys,
              flags.generateTlsKeys
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
