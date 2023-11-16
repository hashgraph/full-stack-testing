import * as core from '../core/index.mjs'
import * as flags from './flags.mjs'
import { BaseCommand } from './base.mjs'
import chalk from 'chalk'
import { constants } from '../core/index.mjs'

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

  async showClusterList (argv) {
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

      this.logger.showUser(`Cluster information (${clusterName})\n---------------------------------------`)
      output.forEach(line => this.logger.showUser(line))
      this.logger.showUser('\n')
      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  async createNamespace (argv) {
    try {
      const namespace = argv.namespace
      const namespaces = await this.getNameSpaces()
      this.logger.showUser(chalk.cyan('> checking namespace:'), chalk.yellow(`${namespace}`))
      if (!namespaces.includes(`namespace/${namespace}`)) {
        this.logger.showUser(chalk.cyan('> creating namespace:'), chalk.yellow(`${namespace} ...`))
        await this.kubectl.createNamespace(namespace)
        this.logger.showUser(chalk.green('OK'), `namespace '${namespace}' is created`)
      } else {
        this.logger.showUser(chalk.green('OK'), `namespace '${namespace}' already exists`)
      }

      await this.kubectl.config(`set-context --current --namespace="${namespace}"`)

      this.logger.showList('namespaces', await this.getNameSpaces())

      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  /**
     * Create a cluster
     * @param argv command arguments
     * @param config config object
     * @returns {Promise<boolean>}
     */
  async create (argv, config = {}) {
    try {
      const clusterName = argv.clusterName
      const clusters = await this.getClusters()

      if (!config) {
        config = this.configManager.setupConfig(argv)
      }

      this.logger.showUser(chalk.cyan('> checking cluster:'), chalk.yellow(`${clusterName}`))
      if (!clusters.includes(clusterName)) {
        this.logger.showUser(chalk.cyan('> creating cluster:'), chalk.yellow(`${clusterName} ...`))
        await this.kind.createCluster(
                    `-n ${clusterName}`,
                    `--config ${core.constants.RESOURCES_DIR}/dev-cluster.yaml`
        )
        this.logger.showUser(chalk.green('OK'), `cluster '${clusterName}' is created`)
      } else {
        this.logger.showUser(chalk.green('OK'), `cluster '${clusterName}' already exists`)
      }

      // show all clusters and cluster-info
      await this.showClusterList()

      await this.getClusterInfo(argv)

      await this.createNamespace(argv)

      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  /**
     * Delete a cluster
     * @param argv
     * @returns {Promise<boolean>}
     */
  async delete (argv) {
    try {
      const clusterName = argv.clusterName
      const clusters = await this.getClusters()
      this.logger.showUser(chalk.cyan('> checking cluster:'), chalk.yellow(`${clusterName}`))
      if (clusters.includes(clusterName)) {
        this.logger.showUser(chalk.cyan('> deleting cluster:'), chalk.yellow(`${clusterName} ...`))
        await this.kind.deleteCluster(clusterName)
        this.logger.showUser(chalk.green('OK'), `cluster '${clusterName}' is deleted`)
      } else {
        this.logger.showUser(chalk.green('OK'), `cluster '${clusterName}' is already deleted`)
      }

      this.logger.showList('clusters', await this.getClusters())

      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  async showInstalledChartList (namespace) {
    this.logger.showList('charts installed', await this.chartManager.getInstalledCharts(namespace))
  }

  /**
     * Setup cluster with shared components
     * @param argv
     * @returns {Promise<boolean>}
     */
  async setup (argv) {
    try {
      const config = await this.configManager.setupConfig(argv)
      const namespace = argv.namespace

      // install fullstack-cluster-setup chart
      const chartPath = await this.prepareChartPath(config)
      const valuesArg = this.prepareValuesArg(config, argv.prometheusStack, argv.minio, argv.envoyGateway,
        argv.certManager, argv.certManagerCrds)
      this.logger.showUser(chalk.cyan('> setting up cluster:'), chalk.yellow(`${chartPath}`, chalk.yellow(valuesArg)))
      await this.chartManager.install(namespace, constants.FST_CHART_SETUP_NAME, chartPath, config.version, valuesArg)
      await this.showInstalledChartList(namespace)

      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
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
              clusterCmd.logger.debug("==== Running 'cluster create' ===")
              clusterCmd.logger.debug(argv)

              clusterCmd.create(argv).then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster create`====')

                if (!r) process.exit(1)
              })
            }
          })
          .command({
            command: 'delete',
            desc: 'Delete a cluster',
            builder: y => flags.setCommandFlags(y, flags.clusterName),
            handler: argv => {
              clusterCmd.logger.debug("==== Running 'cluster delete' ===")
              clusterCmd.logger.debug(argv)

              clusterCmd.delete(argv).then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster delete`====')

                if (!r) process.exit(1)
              })
            }
          })
          .command({
            command: 'list',
            desc: 'List all clusters',
            handler: argv => {
              clusterCmd.logger.debug("==== Running 'cluster list' ===")
              clusterCmd.logger.debug(argv)

              clusterCmd.showClusterList().then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster list`====')

                if (!r) process.exit(1)
              })
            }
          })
          .command({
            command: 'info',
            desc: 'Get cluster info',
            builder: y => flags.setCommandFlags(y, flags.clusterName),
            handler: argv => {
              clusterCmd.logger.debug("==== Running 'cluster info' ===")
              clusterCmd.logger.debug(argv)

              clusterCmd.getClusterInfo(argv).then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster info`====')

                if (!r) process.exit(1)
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
              clusterCmd.logger.debug("==== Running 'cluster setup' ===")
              clusterCmd.logger.debug(argv)

              clusterCmd.setup(argv).then(r => {
                clusterCmd.logger.debug('==== Finished running `cluster setup`====')

                if (!r) process.exit(1)
              })
            }
          })
          .demandCommand(1, 'Select a cluster command')
      }
    }
  }

  prepareValuesArg (config, prometheusStackEnabled, minioEnabled, envoyGatewayEnabled,
    certManagerEnabled, certManagerCrdsEnabled) {
    let valuesArg = ''
    const chartDir = this.configManager.flagValue(config, flags.chartDirectory)
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

  async prepareChartPath (config) {
    const chartDir = this.configManager.flagValue(config, flags.chartDirectory)
    let chartPath = 'full-stack-testing/fullstack-cluster-setup'
    if (chartDir) {
      chartPath = `${chartDir}/fullstack-cluster-setup`
      await this.helm.dependency('update', chartPath)
    }

    return chartPath
  }
}
