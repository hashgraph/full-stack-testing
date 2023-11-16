import { BaseCommand } from './base.mjs'
import * as flags from './flags.mjs'
import { constants } from '../core/index.mjs'

export class ChartCommand extends BaseCommand {
  prepareValuesArg (argv, config) {
    const { valuesFile, mirrorNode, hederaExplorer } = argv

    let valuesArg = ''
    const chartDir = this.configManager.flagValue(config, flags.chartDirectory)
    if (chartDir) {
      valuesArg = `-f ${chartDir}/fullstack-deployment/values.yaml`
    }

    if (valuesFile) {
      valuesArg += `--values ${valuesFile}`
    }

    valuesArg += ` --set hedera-mirror-node.enabled=${mirrorNode} --set hedera-explorer.enabled=${hederaExplorer}`

    return valuesArg
  }

  async prepareChartPath (config) {
    const chartDir = this.configManager.flagValue(config, flags.chartDirectory)
    let chartPath = 'full-stack-testing/fullstack-deployment'
    if (chartDir) {
      chartPath = `${chartDir}/fullstack-deployment`
      await this.helm.dependency('update', chartPath)
    }

    return chartPath
  }

  async install (argv) {
    try {
      const namespace = argv.namespace

      const config = await this.configManager.setupConfig(argv)
      const valuesArg = this.prepareValuesArg(argv, config)
      const chartPath = await this.prepareChartPath(config)

      await this.chartManager.install(namespace, constants.FST_CHART_DEPLOYMENT_NAME, chartPath, config.version, valuesArg)

      this.logger.showList('charts', await this.chartManager.getInstalledCharts(namespace))

      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  async uninstall (argv) {
    const namespace = argv.namespace

    return await this.chartManager.uninstall(namespace, constants.FST_CHART_DEPLOYMENT_NAME)
  }

  async upgrade (argv) {
    const namespace = argv.namespace

    const config = await this.configManager.setupConfig(argv)
    const valuesArg = this.prepareValuesArg(argv, config)
    const chartPath = await this.prepareChartPath(config)

    return await this.chartManager.upgrade(namespace, constants.FST_CHART_DEPLOYMENT_NAME, chartPath, valuesArg)
  }

  static getCommandDefinition (chartCmd) {
    return {
      command: 'chart',
      desc: 'Manage FST chart deployment',
      builder: yargs => {
        return yargs
          .command({
            command: 'install',
            desc: 'Install FST network deployment chart',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.deployMirrorNode,
              flags.deployHederaExplorer,
              flags.valuesFile,
              flags.chartDirectory
            ),
            handler: argv => {
              chartCmd.logger.debug("==== Running 'chart install' ===")
              chartCmd.logger.debug(argv)

              chartCmd.install(argv).then(r => {
                chartCmd.logger.debug('==== Finished running `chart install`====')

                if (!r) process.exit(1)
              })
            }
          })
          .command({
            command: 'uninstall',
            desc: 'Uninstall FST network deployment chart',
            builder: y => flags.setCommandFlags(y, flags.namespace),
            handler: argv => {
              chartCmd.logger.debug("==== Running 'chart uninstall' ===")
              chartCmd.logger.debug(argv)

              chartCmd.uninstall(argv).then(r => {
                chartCmd.logger.debug('==== Finished running `chart uninstall`====')

                if (!r) process.exit(1)
              })
            }
          })
          .command({
            command: 'upgrade',
            desc: 'Refresh existing FST network deployment with new values',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.deployMirrorNode,
              flags.deployHederaExplorer,
              flags.valuesFile,
              flags.chartDirectory
            ),
            handler: argv => {
              chartCmd.logger.debug("==== Running 'chart upgrade' ===")
              chartCmd.logger.debug(argv)

              chartCmd.upgrade(argv).then(r => {
                chartCmd.logger.debug('==== Finished running `chart upgrade`====')

                if (!r) process.exit(1)
              })
            }
          })
          .demandCommand(1, 'Select a chart command')
      }
    }
  }
}
