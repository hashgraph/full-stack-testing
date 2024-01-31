import { ListrEnquirerPromptAdapter } from '@listr2/prompt-adapter-enquirer'
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
    this.logger.showList('Clusters', await this.k8.getClusters())
    return true
  }

  /**
   * Get cluster-info for the given cluster name
   * @returns {Promise<boolean>}
   */
  async getClusterInfo () {
    try {
      const cluster = this.k8.getKubeConfig().getCurrentCluster()
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
          await prompts.execute(task, self.configManager, [
            flags.namespace,
            flags.chartDirectory,
            flags.deployPrometheusStack,
            flags.deployMinio,
            flags.deployCertManager,
            flags.deployCertManagerCrds
          ])

          // prepare config
          ctx.config = {
            namespace: self.configManager.getFlag(flags.namespace) || constants.DEFAULT_NAMESPACE,
            chartDir: self.configManager.getFlag(flags.chartDirectory),
            deployPrometheusStack: self.configManager.getFlag(flags.deployPrometheusStack),
            deployMinio: self.configManager.getFlag(flags.deployMinio),
            deployCertManager: self.configManager.getFlag(flags.deployCertManager),
            deployCertManagerCrds: self.configManager.getFlag(flags.deployCertManagerCrds)
          }

          self.logger.debug('Prepare ctx.config', { config: ctx.config, argv })

          ctx.isChartInstalled = await this.chartManager.isChartInstalled(ctx.config.namespace, constants.FULLSTACK_CLUSTER_SETUP_CHART)
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
            ctx.config.deployCertManager,
            ctx.config.deployCertManagerCrds
          )
        },
        skip: (ctx, _) => ctx.isChartInstalled
      },
      {
        title: `Install '${constants.FULLSTACK_CLUSTER_SETUP_CHART}' chart`,
        task: async (ctx, _) => {
          const namespace = ctx.config.namespace
          const version = ctx.config.version

          const chartPath = ctx.chartPath
          const valuesArg = ctx.valuesArg

          try {
            await self.chartManager.install(namespace, constants.FULLSTACK_CLUSTER_SETUP_CHART, chartPath, version, valuesArg)
          } catch (e) {
            // if error, uninstall the chart and rethrow the error
            self.logger.debug(`Error on installing ${constants.FULLSTACK_CLUSTER_SETUP_CHART}. attempting to rollback by uninstalling the chart`, e)
            try {
              await self.chartManager.uninstall(namespace, constants.FULLSTACK_CLUSTER_SETUP_CHART)
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
          const confirm = await task.prompt(ListrEnquirerPromptAdapter).run({
            type: 'toggle',
            default: false,
            message: 'Are you sure you would like to uninstall fullstack-cluster-setup chart?'
          })

          if (!confirm) {
            process.exit(0)
          }

          self.configManager.load(argv)
          const clusterName = self.configManager.getFlag(flags.clusterName)
          const namespace = argv.namespace || constants.DEFAULT_NAMESPACE
          ctx.config = {
            clusterName,
            namespace
          }

          ctx.isChartInstalled = await this.chartManager.isChartInstalled(ctx.config.namespace, constants.FULLSTACK_CLUSTER_SETUP_CHART)
        }
      },
      {
        title: `Uninstall '${constants.FULLSTACK_CLUSTER_SETUP_CHART}' chart`,
        task: async (ctx, _) => {
          const namespace = ctx.config.namespace
          await self.chartManager.uninstall(namespace, constants.FULLSTACK_CLUSTER_SETUP_CHART)
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
      desc: 'Manage fullstack testing cluster',
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
   * Prepare values arg for cluster setup command
   *
   * @param chartDir local charts directory (default is empty)
   * @param prometheusStackEnabled a bool to denote whether to install prometheus stack
   * @param minioEnabled a bool to denote whether to install minio
   * @param certManagerEnabled a bool to denote whether to install cert manager
   * @param certManagerCrdsEnabled a bool to denote whether to install cert manager CRDs
   * @returns {string}
   */
  prepareValuesArg (chartDir = flags.chartDirectory.definition.default,
    prometheusStackEnabled = flags.deployPrometheusStack.definition.default,
    minioEnabled = flags.deployMinio.definition.default,
    certManagerEnabled = flags.deployCertManager.definition.default,
    certManagerCrdsEnabled = flags.deployCertManagerCrds.definition.default
  ) {
    let valuesArg = ''
    if (chartDir) {
      valuesArg = `-f ${chartDir}/fullstack-cluster-setup/values.yaml`
    }

    valuesArg += ` --set cloud.prometheusStack.enabled=${prometheusStackEnabled}`
    valuesArg += ` --set cloud.minio.enabled=${minioEnabled}`
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