import { Listr } from 'listr2'
import { FullstackTestingError } from '../core/errors.mjs'
import * as flags from './flags.mjs'
import { BaseCommand } from './base.mjs'
import chalk from 'chalk'
import { constants } from '../core/index.mjs'
import * as prompts from './prompts.mjs'

/**
 * Define the core functionalities of 'cluster' command
 */
export class ClusterCommand extends BaseCommand {
  async showClusterList () {
    this.logger.showList('Clusters', await this.kubectl2.getClusters())
    return true
  }

  /**
   * Get cluster-info for the given cluster name
   * @returns {Promise<boolean>}
   */
  async getClusterInfo () {
    try {
      const cluster = this.kubectl2.getKubeConfig().getCurrentCluster()
      this.logger.showJSON(`Cluster Information (${cluster.name})`, cluster)
      this.logger.showUser('\n')
      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  /**
   * Show list of installed chart
   * @param namespace
   */
  async showInstalledChartList (namespace) {
    this.logger.showList('Installed Charts', await this.chartManager.getInstalledCharts(namespace))
  }

  /**
   * Setup cluster with shared components
   * @param argv
   * @returns {Promise<boolean>}
   */
  async setup (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          self.configManager.load(argv)

          // extract config values
          const clusterName = self.configManager.getFlag(flags.clusterName)
          const namespace = argv.namespace || constants.DEFAULT_NAMESPACE
          const chartDir = self.configManager.getFlag(flags.chartDirectory)
          const deployPrometheusStack = self.configManager.getFlag(flags.deployPrometheusStack)
          const deployMinio = self.configManager.getFlag(flags.deployMinio)
          const deployEnvoyGateway = self.configManager.getFlag(flags.deployEnvoyGateway)
          const deployCertManager = self.configManager.getFlag(flags.deployCertManager)
          const deployCertManagerCrds = self.configManager.getFlag(flags.deployCertManagerCrds)

          // prompt if inputs are empty and set it in the context
          ctx.config = {
            clusterName,
            namespace,
            chartDir: await prompts.promptChartDir(task, chartDir),
            deployPrometheusStack: await prompts.promptDeployPrometheusStack(task, deployPrometheusStack),
            deployMinio: await prompts.promptDeployMinio(task, deployMinio),
            deployEnvoyGateway: await prompts.promptDeployEnvoyGateway(task, deployEnvoyGateway),
            deployCertManager: await prompts.promptDeployCertManager(task, deployCertManager),
            deployCertManagerCrds: await prompts.promptDeployCertManagerCrds(task, deployCertManagerCrds)
          }

          self.logger.debug('Prepare ctx.config', { config: ctx.config, argv })

          ctx.isChartInstalled = await this.chartManager.isChartInstalled(ctx.config.namespace, constants.CHART_FST_SETUP_NAME)
        }
      },
      {
        title: 'Prepare chart values',
        task: async (ctx, _) => {
          ctx.chartPath = await this.prepareChartPath(ctx.config.chartDir)
          ctx.valuesArg = this.prepareValuesArg(
            ctx.config.chartDir,
            ctx.config.deployPrometheusStack,
            ctx.config.deployMinio,
            ctx.config.deployEnvoyGateway,
            ctx.config.deployCertManager,
            ctx.config.deployCertManagerCrds
          )
        },
        skip: (ctx, _) => ctx.isChartInstalled
      },
      {
        title: `Install '${constants.CHART_FST_SETUP_NAME}' chart`,
        task: async (ctx, _) => {
          const namespace = ctx.config.namespace
          const version = ctx.config.version

          const chartPath = ctx.chartPath
          const valuesArg = ctx.valuesArg

          try {
            await self.chartManager.install(namespace, constants.CHART_FST_SETUP_NAME, chartPath, version, valuesArg)
          } catch (e) {
            // if error, uninstall the chart and rethrow the error
            self.logger.debug(`Error on installing ${constants.CHART_FST_SETUP_NAME}. attempting to rollback by uninstalling the chart`, e)
            try {
              await self.chartManager.uninstall(namespace, constants.CHART_FST_SETUP_NAME)
            } catch (ex) {
              // ignore error during uninstall since we are doing the best-effort uninstall here
            }

            throw e
          }

          await self.showInstalledChartList(namespace)
        },
        skip: (ctx, _) => ctx.isChartInstalled
      }
    ], {
      concurrent: false,
      rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
    })

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error on cluster setup', e)
    }

    return true
  }

  /**
   * Uninstall shared components from the cluster and perform any other necessary cleanups
   * @param argv
   * @returns {Promise<boolean>}
   */
  async reset (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          self.configManager.load(argv)
          const clusterName = self.configManager.getFlag(flags.clusterName)
          const namespace = argv.namespace || constants.DEFAULT_NAMESPACE

          ctx.config = {
            clusterName,
            namespace
          }

          ctx.isChartInstalled = await this.chartManager.isChartInstalled(ctx.config.namespace, constants.CHART_FST_SETUP_NAME)
        }
      },
      {
        title: `Uninstall '${constants.CHART_FST_SETUP_NAME}' chart`,
        task: async (ctx, _) => {
          const namespace = ctx.config.namespace
          await self.chartManager.uninstall(namespace, constants.CHART_FST_SETUP_NAME)
          await self.showInstalledChartList(namespace)
        },
        skip: (ctx, _) => !ctx.isChartInstalled
      }
    ], {
      concurrent: false,
      rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
    })

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error on cluster reset', e)
    }

    return true
  }

  /**
   * Return Yargs command definition for 'cluster' command
   * @param clusterCmd an instance of ClusterCommand
   */
  static getCommandDefinition (clusterCmd) {
    return {
      command: 'cluster',
      desc: 'Manage cluster',
      builder: yargs => {
        return yargs
          .command({
            command: 'list',
            desc: 'List all available clusters',
            handler: argv => {
              clusterCmd.logger.debug("==== Running 'cluster list' ===", { argv })

              clusterCmd.showClusterList().then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster list`====')

                if (!r) process.exit(1)
              }).catch(err => {
                clusterCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'info',
            desc: 'Get cluster info',
            handler: argv => {
              clusterCmd.logger.debug("==== Running 'cluster info' ===", { argv })
              clusterCmd.getClusterInfo(argv).then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster info`====')

                if (!r) process.exit(1)
              }).catch(err => {
                clusterCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'setup',
            desc: 'Setup cluster with shared components',
            builder: y => flags.setCommandFlags(y,
              flags.clusterName,
              flags.namespace,
              flags.chartDirectory,
              flags.deployPrometheusStack,
              flags.deployMinio,
              flags.deployEnvoyGateway,
              flags.deployCertManager,
              flags.deployCertManagerCrds
            ),
            handler: argv => {
              clusterCmd.logger.debug("==== Running 'cluster setup' ===", { argv })

              clusterCmd.setup(argv).then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster setup`====')

                if (!r) process.exit(1)
              }).catch(err => {
                clusterCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'reset',
            desc: 'Uninstall shared components from cluster',
            builder: y => flags.setCommandFlags(y,
              flags.clusterName,
              flags.namespace
            ),
            handler: argv => {
              clusterCmd.logger.debug("==== Running 'cluster reset' ===", { argv })

              clusterCmd.reset(argv).then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster reset`====')

                if (!r) process.exit(1)
              }).catch(err => {
                clusterCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .demandCommand(1, 'Select a cluster command')
      }
    }
  }

  /**
   * Prepare values arg for chart install command
   *
   * @param chartDir local charts directory (default is empty)
   * @param prometheusStackEnabled a bool to denote whether to install prometheus stack
   * @param minioEnabled a bool to denote whether to install minio
   * @param envoyGatewayEnabled a bool to denote whether to install envoy-gateway
   * @param certManagerEnabled a bool to denote whether to install cert manager
   * @param certManagerCrdsEnabled a bool to denote whether to install cert manager CRDs
   * @returns {string}
   */
  prepareValuesArg (chartDir = flags.chartDirectory.definition.default,
    prometheusStackEnabled = flags.deployPrometheusStack.definition.default,
    minioEnabled = flags.deployMinio.definition.default,
    envoyGatewayEnabled = flags.deployEnvoyGateway.definition.default,
    certManagerEnabled = flags.deployCertManager.definition.default,
    certManagerCrdsEnabled = flags.deployCertManagerCrds.definition.default
  ) {
    let valuesArg = ''
    if (chartDir) {
      valuesArg = `-f ${chartDir}/fullstack-cluster-setup/values.yaml`
    }

    valuesArg += ` --set cloud.prometheusStack.enabled=${prometheusStackEnabled}`
    valuesArg += ` --set cloud.minio.enabled=${minioEnabled}`
    valuesArg += ` --set cloud.envoyGateway.enabled=${envoyGatewayEnabled}`
    valuesArg += ` --set cloud.certManager.enabled=${certManagerEnabled}`
    valuesArg += ` --set cert-manager.installCRDs=${certManagerCrdsEnabled}`

    if (certManagerEnabled && !certManagerCrdsEnabled) {
      this.logger.showUser(chalk.yellowBright('> WARNING:'), chalk.yellow(
        'cert-manager CRDs are required for cert-manager, please enable it if you have not installed it independently.'))
    }

    return valuesArg
  }

  /**
   * Prepare chart path
   * @param chartDir local charts directory (default is empty)
   * @returns {Promise<string>}
   */
  async prepareChartPath (chartDir = flags.chartDirectory.definition.default) {
    let chartPath = 'full-stack-testing/fullstack-cluster-setup'
    if (chartDir) {
      chartPath = `${chartDir}/fullstack-cluster-setup`
      await this.helm.dependency('update', chartPath)
    }

    return chartPath
  }
}
