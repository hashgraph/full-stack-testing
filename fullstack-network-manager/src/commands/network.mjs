import { ListrEnquirerPromptAdapter } from '@listr2/prompt-adapter-enquirer'
import chalk from 'chalk'
import { Listr } from 'listr2'
import { FullstackTestingError } from '../core/errors.mjs'
import { BaseCommand } from './base.mjs'
import * as flags from './flags.mjs'
import * as paths from 'path'
import { constants, Templates } from '../core/index.mjs'
import * as prompts from './prompts.mjs'

export class NetworkCommand extends BaseCommand {
  getTlsValueArguments (enableTls, tlsClusterIssuerName, tlsClusterIssuerNamespace, enableHederaExplorerTls) {
    const gatewayPrefix = 'gatewayApi.gateway'
    let valuesArg = ` --set ${gatewayPrefix}.tlsEnabled=${enableTls}`
    valuesArg += ` --set ${gatewayPrefix}.tlsClusterIssuerName=${tlsClusterIssuerName}`
    valuesArg += ` --set ${gatewayPrefix}.tlsClusterIssuerNamespace=${tlsClusterIssuerNamespace}`

    const listenerPrefix = `${gatewayPrefix}.listeners`
    valuesArg += ` --set ${listenerPrefix}.grpcs.tlsEnabled=${enableTls}`
    valuesArg += ` --set ${listenerPrefix}.grpcWeb.tlsEnabled=${enableTls}`

    if (enableTls || enableHederaExplorerTls) {
      valuesArg += ` --set ${listenerPrefix}.hederaExplorer.tlsEnabled=true`
    }

    return valuesArg
  }

  prepareValuesFiles (valuesFile) {
    let valuesArg = ''
    if (valuesFile) {
      const valuesFiles = valuesFile.split(',')
      valuesFiles.forEach(vf => {
        const vfp = paths.resolve(vf)
        valuesArg += ` --values ${vfp}`
      })
    }

    return valuesArg
  }

  prepareValuesArg (chartDir, valuesFile, deployMirrorNode, deployHederaExplorer, enableTls, tlsClusterIssuerName,
    tlsClusterIssuerNamespace, enableHederaExplorerTls, acmeClusterIssuer, selfSignedClusterIssuer) {
    let valuesArg = ''
    if (chartDir) {
      valuesArg = `-f ${chartDir}/fullstack-deployment/values.yaml`
    }

    valuesArg += this.prepareValuesFiles(valuesFile)

    valuesArg += ` --set hedera-mirror-node.enabled=${deployMirrorNode} --set hedera-explorer.enabled=${deployHederaExplorer}`
    valuesArg += ` --set cloud.acmeClusterIssuer.enabled=${acmeClusterIssuer}`
    valuesArg += ` --set cloud.selfSignedClusterIssuer.enabled=${selfSignedClusterIssuer}`

    if (enableTls) {
      valuesArg += this.getTlsValueArguments(enableTls, tlsClusterIssuerName, tlsClusterIssuerNamespace, enableHederaExplorerTls)
    }

    return valuesArg
  }

  async prepareConfig (task, argv) {
    this.configManager.load(argv)
    const namespace = this.configManager.getFlag(flags.namespace)
    const nodeIds = this.configManager.getFlag(flags.nodeIDs)
    const chartDir = this.configManager.getFlag(flags.chartDirectory)
    const valuesFile = this.configManager.getFlag(flags.valuesFile)
    const deployMirrorNode = this.configManager.getFlag(flags.deployMirrorNode)
    const deployExplorer = this.configManager.getFlag(flags.deployHederaExplorer)
    const enableTls = this.configManager.getFlag(flags.enableTls)
    const tlsClusterIssuerName = this.configManager.getFlag(flags.tlsClusterIssuerName)
    const tlsClusterIssuerNamespace = this.configManager.getFlag(flags.tlsClusterIssuerNamespace)
    const enableHederaExplorerTls = this.configManager.getFlag(flags.enableHederaExplorerTls)
    const acmeClusterIssuer = this.configManager.getFlag(flags.acmeClusterIssuer)
    const selfSignedClusterIssuer = this.configManager.getFlag(flags.selfSignedClusterIssuer)

    // prompt if values are missing and create a config object
    const config = {
      namespace: await prompts.promptNamespaceArg(task, namespace),
      nodeIds: await prompts.promptNodeIdsArg(task, nodeIds),
      chartDir: await prompts.promptChartDir(task, chartDir),
      valuesFile: await prompts.promptChartDir(task, valuesFile),
      deployMirrorNode: await prompts.promptDeployMirrorNode(task, deployMirrorNode),
      deployHederaExplorer: await prompts.promptDeployHederaExplorer(task, deployExplorer),
      enableTls: await prompts.promptEnableTls(task, enableTls),
      tlsClusterIssuerName: await prompts.promptTlsClusterIssuerName(task, tlsClusterIssuerName),
      tlsClusterIssuerNamespace: await prompts.promptTlsClusterIssuerNamespace(task, tlsClusterIssuerNamespace),
      enableHederaExplorerTls: await prompts.promptEnableHederaExplorerTls(task, enableHederaExplorerTls),
      acmeClusterIssuer: await prompts.promptAcmeClusterIssuer(task, acmeClusterIssuer),
      selfSignedClusterIssuer: await prompts.promptSelfSignedClusterIssuer(task, selfSignedClusterIssuer),
      version: this.configManager.getVersion()
    }

    // compute values
    config.chartPath = await this.prepareChartPath(config.chartDir,
      constants.CHART_FST_REPO_NAME, constants.CHART_FST_DEPLOYMENT_NAME)

    config.valuesArg = this.prepareValuesArg(config.chartDir,
      config.valuesFile, config.deployMirrorNode, config.deployHederaExplorer,
      config.enableTls, config.tlsClusterIssuerName, config.tlsClusterIssuerNamespace, config.enableHederaExplorerTls,
      config.acmeClusterIssuer, config.selfSignedClusterIssuer)

    return config
  }

  /**
   * Run helm install and deploy network components
   * @param argv
   * @return {Promise<boolean>}
   */
  async deploy (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          ctx.config = await self.prepareConfig(task, argv)
        }
      },
      {
        title: `Install chart '${constants.CHART_FST_DEPLOYMENT_NAME}'`,
        task: async (ctx, _) => {
          if (await self.chartManager.isChartInstalled(ctx.config.namespace, constants.CHART_FST_DEPLOYMENT_NAME)) {
            await self.chartManager.uninstall(ctx.config.namespace, constants.CHART_FST_DEPLOYMENT_NAME)
          }

          await this.chartManager.install(
            ctx.config.namespace,
            constants.CHART_FST_DEPLOYMENT_NAME,
            ctx.config.chartPath,
            ctx.config.version,
            ctx.config.valuesArg)
        }
      },
      {
        title: 'Waiting for network pods to be ready',
        task:
          async (ctx, task) => {
            const subTasks = []
            for (const nodeId of ctx.config.nodeIds) {
              const podName = Templates.renderNetworkPodName(nodeId)
              subTasks.push({
                title: `Node: ${chalk.yellow(nodeId)} (Pod: ${podName})`,
                task: () =>
                  self.k8.waitForPod(constants.POD_STATUS_RUNNING, [
                    'fullstack.hedera.com/type=network-node',
                    `fullstack.hedera.com/node-name=${nodeId}`
                  ], 1, 60 * 15, 1000) // timeout 15 minutes
              })
            }

            // set up the sub-tasks
            return task.newListr(subTasks, {
              concurrent: false, // no need to run concurrently since if one node is up, the rest should be up by then
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
      throw new FullstackTestingError(`Error installing chart ${constants.CHART_FST_DEPLOYMENT_NAME}`, e)
    }

    return true
  }

  /**
   * Run helm uninstall and destroy network components
   * @param argv
   * @return {Promise<boolean>}
   */
  async destroy (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          if (!argv.force) {
            const confirm = await task.prompt(ListrEnquirerPromptAdapter).run({
              type: 'toggle',
              default: false,
              message: 'Are you sure you would like to destroy the network components?'
            })

            if (!confirm) {
              process.exit(0)
            }
          }

          self.configManager.load(argv)
          const namespace = self.configManager.getFlag(flags.namespace)
          ctx.config = {
            namespace: await prompts.promptNamespaceArg(task, namespace)
          }
        }
      },
      {
        title: `Uninstall chart ${constants.CHART_FST_DEPLOYMENT_NAME}`,
        task: async (ctx, _) => {
          await self.chartManager.uninstall(ctx.config.namespace, constants.CHART_FST_DEPLOYMENT_NAME)
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

  /**
   * Run helm upgrade to refresh network components with new settings
   * @param argv
   * @return {Promise<boolean>}
   */
  async refresh (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          ctx.config = await self.prepareConfig(task, argv)
        }
      },
      {
        title: `Upgrade chart '${constants.CHART_FST_DEPLOYMENT_NAME}'`,
        task: async (ctx, _) => {
          await this.chartManager.upgrade(
            ctx.config.namespace,
            constants.CHART_FST_DEPLOYMENT_NAME,
            ctx.config.chartPath,
            ctx.config.valuesArg)
        }
      },
      {
        title: 'Waiting for network pods to be ready',
        task: async (ctx, _) => {
          await this.k8.waitForPod(constants.POD_STATUS_RUNNING, [
            'fullstack.hedera.com/type=network-node'
          ], 1)
        }
      }
    ], {
      concurrent: false,
      rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
    })

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError(`Error upgrading chart ${constants.CHART_FST_DEPLOYMENT_NAME}`, e)
    }

    return true
  }

  static getCommandDefinition (networkCmd) {
    return {
      command: 'network',
      desc: 'Manage fullstack testing network deployment',
      builder: yargs => {
        return yargs
          .command({
            command: 'deploy',
            desc: 'Deploy fullstack testing network',
            builder: y => {
              flags.setCommandFlags(y,
                flags.namespace,
                flags.nodeIDs,
                flags.deployMirrorNode,
                flags.deployHederaExplorer,
                flags.deployJsonRpcRelay,
                flags.valuesFile,
                flags.chartDirectory,
                flags.enableTls,
                flags.tlsClusterIssuerName,
                flags.tlsClusterIssuerNamespace,
                flags.enableHederaExplorerTls,
                flags.acmeClusterIssuer,
                flags.selfSignedClusterIssuer
              )
            },
            handler: argv => {
              networkCmd.logger.debug("==== Running 'network deploy' ===")
              networkCmd.logger.debug(argv)

              networkCmd.deploy(argv).then(r => {
                networkCmd.logger.debug('==== Finished running `network deploy`====')

                if (!r) process.exit(1)
              }).catch(err => {
                networkCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'destroy',
            desc: 'Destroy fullstack testing network',
            builder: y => flags.setCommandFlags(y, flags.namespace, flags.force),
            handler: argv => {
              networkCmd.logger.debug("==== Running 'network destroy' ===")
              networkCmd.logger.debug(argv)

              networkCmd.destroy(argv).then(r => {
                networkCmd.logger.debug('==== Finished running `network destroy`====')

                if (!r) process.exit(1)
              }).catch(err => {
                networkCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'refresh',
            desc: 'Refresh fullstack testing network deployment',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.deployMirrorNode,
              flags.deployHederaExplorer,
              flags.valuesFile,
              flags.chartDirectory,
              flags.enableTls,
              flags.tlsClusterIssuerName,
              flags.tlsClusterIssuerNamespace,
              flags.enableHederaExplorerTls,
              flags.acmeClusterIssuer,
              flags.selfSignedClusterIssuer
            ),
            handler: argv => {
              networkCmd.logger.debug("==== Running 'chart upgrade' ===")
              networkCmd.logger.debug(argv)

              networkCmd.refresh(argv).then(r => {
                networkCmd.logger.debug('==== Finished running `chart upgrade`====')

                if (!r) process.exit(1)
              }).catch(err => {
                networkCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .demandCommand(1, 'Select a chart command')
      }
    }
  }
}
