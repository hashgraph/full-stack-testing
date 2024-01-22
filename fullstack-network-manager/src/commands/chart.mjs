import { Listr } from 'listr2'
import { FullstackTestingError } from '../core/errors.mjs'
import { BaseCommand } from './base.mjs'
import * as flags from './flags.mjs'
import * as paths from 'path'
import { constants } from '../core/index.mjs'
import * as prompts from './prompts.mjs'

export class ChartCommand extends BaseCommand {
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
      timeout: 900,
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

  async install (argv) {
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
        task: async (ctx, _) => {
          const timeout = ctx.config.timeout || 900
          await this.kubectl2.waitForPod(constants.POD_STATUS_RUNNING, [
            'fullstack.hedera.com/type=network-node'
          ], ctx.config.nodeIds.length, timeout * 1000, 1000)
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

  async uninstall (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
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

  async upgrade (argv) {
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
          const timeout = ctx.config.timeout || 900
          await this.kubectl2.waitForPod(constants.POD_STATUS_RUNNING, [
            'fullstack.hedera.com/type=network-node'
          ], timeout)
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

  static getCommandDefinition (chartCmd) {
    return {
      command: 'chart',
      desc: 'Manage chart deployment',
      builder: yargs => {
        return yargs
          .command({
            command: 'install',
            desc: 'Install network deployment chart',
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
              chartCmd.logger.debug("==== Running 'chart install' ===")
              chartCmd.logger.debug(argv)

              chartCmd.install(argv).then(r => {
                chartCmd.logger.debug('==== Finished running `chart install`====')

                if (!r) process.exit(1)
              }).catch(err => {
                chartCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'uninstall',
            desc: 'Uninstall network deployment chart',
            builder: y => flags.setCommandFlags(y, flags.namespace),
            handler: argv => {
              chartCmd.logger.debug("==== Running 'chart uninstall' ===")
              chartCmd.logger.debug(argv)

              chartCmd.uninstall(argv).then(r => {
                chartCmd.logger.debug('==== Finished running `chart uninstall`====')

                if (!r) process.exit(1)
              }).catch(err => {
                chartCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'upgrade',
            desc: 'Refresh existing network deployment with new values',
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
              chartCmd.logger.debug("==== Running 'chart upgrade' ===")
              chartCmd.logger.debug(argv)

              chartCmd.upgrade(argv).then(r => {
                chartCmd.logger.debug('==== Finished running `chart upgrade`====')

                if (!r) process.exit(1)
              }).catch(err => {
                chartCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .demandCommand(1, 'Select a chart command')
      }
    }
  }
}
