import { Listr } from 'listr2'
import { FullstackTestingError } from '../core/errors.mjs'
import * as core from '../core/index.mjs'
import * as flags from './flags.mjs'
import { BaseCommand } from './base.mjs'
import chalk from 'chalk'
import { constants } from '../core/index.mjs'
import * as prompts from './prompts.mjs'

/**
 * Define the core functionalities of 'cluster' command
 */
export class ClusterCommand extends BaseCommand {
  /**
   * List available clusters
   * @returns {Promise<string[]>}
   */
  async getClusters () {
    try {
      return await this.kind.getClusters('-q')
    } catch (e) {
      this.logger.showUserError(e)
    }

    return []
  }

  async showClusterList () {
    this.logger.showList('clusters', await this.getClusters())
    return true
  }

  /**
   * List available namespaces
   * @returns {Promise<string[]>}
   */
  async getNameSpaces () {
    try {
      return await this.kubectl.getNamespace('--no-headers', '-o name')
    } catch (e) {
      this.logger.showUserError(e)
    }

    return []
  }

  /**
   * Get cluster-info for the given cluster name
   * @param argv arguments containing cluster name
   * @returns {Promise<boolean>}
   */
  async getClusterInfo (argv) {
    try {
      const clusterName = argv.clusterName
      const cmd = `kubectl cluster-info --context kind-${clusterName}`
      const output = await this.run(cmd)

      this.logger.showUser(chalk.green(`\nCluster information (${clusterName})\n---------------------------------------`))
      output.forEach(line => this.logger.showUser(line))
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
   * @returns {Promise<void>}
   */
  async showInstalledChartList (namespace) {
    this.logger.showList('Installed Charts', await this.chartManager.getInstalledCharts(namespace))
  }

  /**
   * Create a cluster
   * @param argv command arguments
   * @returns {Promise<boolean>}
   */
  async create (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          const cachedConfig = await self.configManager.setupConfig(argv)

          // get existing choices
          ctx.clusters = await self.kind.getClusters('-q')

          // extract config values
          const clusterName = self.configManager.flagValue(cachedConfig, flags.clusterName)
          const namespace = self.configManager.flagValue(cachedConfig, flags.namespace)

          ctx.config = {
            clusterName: await prompts.promptClusterNameArg(task, clusterName),
            namespace: await prompts.promptNamespaceArg(task, namespace)
          }
        }
      },
      {
        title: 'Create cluster',
        task: async (ctx, _) => {
          const clusterName = ctx.config.clusterName
          ctx.clusters = await self.getClusters()
          if (!ctx.clusters.includes(clusterName)) {
            await self.kind.createCluster(
              `-n ${clusterName}`,
              `--config ${core.constants.RESOURCES_DIR}/dev-cluster.yaml`
            )

            await self.kubectl.get('--raw=\'/healthz?verbose\'')
          }
        }
      },
      {
        title: 'Create namespace',
        task: async (ctx, _) => {
          const namespace = ctx.config.namespace
          ctx.namespaces = await self.getNameSpaces()
          if (!ctx.namespaces.includes(`namespace/${namespace}`)) {
            await self.kubectl.createNamespace(namespace)
          }

          await this.kubectl.config(`set-context --current --namespace="${namespace}"`)

          // display info
          ctx.kubeContexts = await self.kubectl.config('get-contexts --no-headers | awk \'{print $2 " [" $NF "]"}\'')
          self.logger.showList('Namespaces', ctx.namespaces)
          self.logger.showList('Clusters', ctx.clusters)
          self.logger.showList('Kubernetes Contexts', ctx.kubeContexts)
        }
      }
    ])

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error on cluster create', e)
    }

    return true
  }

  /**
   * Delete a cluster
   * @param argv
   * @returns {Promise<boolean>}
   */
  async delete (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          const cachedConfig = await self.configManager.setupConfig(argv)
          const clusterName = self.configManager.flagValue(cachedConfig, flags.clusterName)

          // get existing choices
          ctx.clusters = await self.kind.getClusters('-q')

          ctx.config = {
            clusterName: await prompts.promptSelectClusterNameArg(task, clusterName, ctx.clusters)
          }
        }
      },
      {
        title: 'Delete cluster',
        task: async (ctx, _) => {
          await this.kind.deleteCluster(ctx.config.clusterName)
          self.logger.showList('Clusters', await self.getClusters())
        },
        skip: (ctx, _) => !ctx.clusters.includes(ctx.config.clusterName)
      }
    ])

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError('Error on cluster reset', e)
    }

    return true
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
          const cachedConfig = await self.configManager.setupConfig(argv)
          self.logger.debug('Setup cached config', { cachedConfig, argv })

          // extract config values
          const clusterName = self.configManager.flagValue(cachedConfig, flags.clusterName)
          const namespace = self.configManager.flagValue(cachedConfig, flags.namespace)
          const chartDir = self.configManager.flagValue(cachedConfig, flags.chartDirectory)
          const deployPrometheusStack = self.configManager.flagValue(cachedConfig, flags.deployPrometheusStack)
          const deployMinio = self.configManager.flagValue(cachedConfig, flags.deployMinio)
          const deployEnvoyGateway = self.configManager.flagValue(cachedConfig, flags.deployEnvoyGateway)
          const deployCertManager = self.configManager.flagValue(cachedConfig, flags.deployCertManager)
          const deployCertManagerCRDs = self.configManager.flagValue(cachedConfig, flags.deployCertManagerCRDs)

          // get existing choices
          const clusters = await self.kind.getClusters('-q')
          const namespaces = await self.kubectl.getNamespace('--no-headers', '-o name')

          // prompt if inputs are empty and set it in the context
          ctx.config = {
            clusterName: await prompts.promptSelectClusterNameArg(task, clusterName, clusters),
            namespace: await prompts.promptSelectNamespaceArg(task, namespace, namespaces),
            chartDir: await prompts.promptChartDir(task, chartDir),
            deployPrometheusStack: await prompts.promptDeployPrometheusStack(task, deployPrometheusStack),
            deployMinio: await prompts.promptDeployMinio(task, deployMinio),
            deployEnvoyGateway: await prompts.promptDeployEnvoyGateway(task, deployEnvoyGateway),
            deployCertManager: await prompts.promptDeployCertManager(task, deployCertManager, namespaces),
            deployCertManagerCRDs: await prompts.promptDeployCertManagerCRDs(task, deployCertManagerCRDs, namespaces)
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
            ctx.config.deployCertManagerCRDs
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

          await self.chartManager.install(namespace, constants.CHART_FST_SETUP_NAME, chartPath, version, valuesArg)
          await self.showInstalledChartList(namespace)
        },
        skip: (ctx, _) => ctx.isChartInstalled
      }
    ])

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
          const cachedConfig = await self.configManager.setupConfig(argv)
          const clusterName = self.configManager.flagValue(cachedConfig, flags.clusterName)
          const namespace = self.configManager.flagValue(cachedConfig, flags.namespace)

          // get existing choices
          const clusters = await self.kind.getClusters('-q')
          const namespaces = await self.kubectl.getNamespace('--no-headers', '-o name')

          ctx.config = {
            clusterName: await prompts.promptSelectClusterNameArg(task, clusterName, clusters),
            namespace: await prompts.promptSelectNamespaceArg(task, namespace, namespaces)
          }

          ctx.isChartInstalled = await this.chartManager.isChartInstalled(namespace, constants.CHART_FST_SETUP_NAME)
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
    ])

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
      desc: 'Manage FST cluster',
      builder: yargs => {
        return yargs
          .command({
            command: 'create',
            desc: 'Create a cluster',
            builder: y => flags.setCommandFlags(y, flags.clusterName, flags.namespace),
            handler: argv => {
              clusterCmd.logger.debug("==== Running 'cluster create' ===", { argv })

              clusterCmd.create(argv).then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster create`====')

                if (!r) process.exit(1)
              }).catch(err => {
                clusterCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'delete',
            desc: 'Delete a cluster',
            builder: y => flags.setCommandFlags(y, flags.clusterName),
            handler: argv => {
              clusterCmd.logger.debug("==== Running 'cluster delete' ===", { argv })

              clusterCmd.delete(argv).then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster delete`====')

                if (!r) process.exit(1)
              }).catch(err => {
                clusterCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'list',
            desc: 'List all clusters',
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
            builder: y => flags.setCommandFlags(y, flags.clusterName),
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
              flags.deployCertManagerCRDs
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
    certManagerCrdsEnabled = flags.deployCertManagerCRDs.definition.default
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
