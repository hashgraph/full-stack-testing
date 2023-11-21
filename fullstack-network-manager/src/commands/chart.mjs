import chalk from 'chalk'
import { FullstackTestingError } from '../core/errors.mjs'
import { BaseCommand } from './base.mjs'
import * as flags from './flags.mjs'
import * as paths from 'path'
import { constants } from '../core/index.mjs'

export class ChartCommand extends BaseCommand {
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

  prepareValuesArg (config) {
    const valuesFile = this.configManager.flagValue(config, flags.valuesFile)
    const deployMirrorNode = this.configManager.flagValue(config, flags.deployMirrorNode)
    const deployHederaExplorer = this.configManager.flagValue(config, flags.deployHederaExplorer)

    let valuesArg = ''
    const chartDir = this.configManager.flagValue(config, flags.chartDirectory)
    if (chartDir) {
      valuesArg = `-f ${chartDir}/fullstack-deployment/values.yaml`
    }

    valuesArg += this.prepareValuesFiles(valuesFile)

    valuesArg += ` --set hedera-mirror-node.enabled=${deployMirrorNode} --set hedera-explorer.enabled=${deployHederaExplorer}`

    return valuesArg
  }

  async prepareChartPath (config, chartRepo = 'full-stack-testing', chartName = 'fullstack-deployment') {
    const chartDir = this.configManager.flagValue(config, flags.chartDirectory)
    if (chartDir) {
      const chartPath = `${chartDir}/${chartName}`
      await this.helm.dependency('update', chartPath)
      return chartPath
    }

    return `${chartRepo}/${chartName}`
  }

  async installFSTChart (config) {
    try {
      const namespace = this.configManager.flagValue(config, flags.namespace)
      const valuesArg = this.prepareValuesArg(config)
      const chartPath = await this.prepareChartPath(config, constants.CHART_FST_REPO_NAME, constants.CHART_FST_DEPLOYMENT_NAME)

      await this.chartManager.install(namespace, constants.CHART_FST_DEPLOYMENT_NAME, chartPath, config.version, valuesArg)

      this.logger.showUser(chalk.cyan('> waiting for network-node pods to be active (first deployment takes ~10m) ...'))
      await this.kubectl.wait('pod',
        '--for=jsonpath=\'{.status.phase}\'=Running',
        '-l fullstack.hedera.com/type=network-node',
        '--timeout=900s'
      )
      this.logger.showUser(chalk.green('OK'), 'network-node pods are running')
    } catch (e) {
      throw new FullstackTestingError(`failed install '${constants.CHART_FST_DEPLOYMENT_NAME}' chart`, e)
    }
  }

  async installJSONRpcRelay (config) {
    try {
      const namespace = this.configManager.flagValue(config, flags.namespace)
      const valuesArg = this.prepareValuesFiles(config[flags.relayValuesFile.name])
      const chartPath = await this.prepareChartPath(config, constants.CHART_JSON_RPC_RELAY_REPO_NAME, constants.CHART_JSON_RPC_RELAY_NAME)

      await this.chartManager.install(namespace, constants.CHART_JSON_RPC_RELAY_NAME, chartPath, '', valuesArg)

      // this.logger.showUser(chalk.cyan('> waiting for hedera-json-rpc-relay to be active ...'))
      // await this.kubectl.wait('pod',
      //   '--for=jsonpath=\'{.status.phase}\'=Running',
      //   '-l fullstack.hedera.com/type=network-node',
      //   '--timeout=900s'
      // )
      this.logger.showUser(chalk.green('OK'), 'hedera-json-rpc-relay pods are running')
    } catch (e) {
      throw new FullstackTestingError(`failed install '${constants.CHART_JSON_RPC_RELAY_NAME}' chart`, e)
    }
  }

  async install (argv) {
    try {
      const config = await this.configManager.setupConfig(argv)
      const namespace = this.configManager.flagValue(config, flags.namespace)

      await this.installFSTChart(config)
      await this.installJSONRpcRelay(config)
      this.logger.showList('Deployed Charts', await this.chartManager.getInstalledCharts(namespace))
      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  async uninstall (argv) {
    const namespace = argv.namespace

    return await this.chartManager.uninstall(namespace, constants.CHART_FST_DEPLOYMENT_NAME)
  }

  async upgrade (argv) {
    const namespace = argv.namespace

    const config = await this.configManager.setupConfig(argv)
    const valuesArg = this.prepareValuesArg(argv, config)
    const chartPath = await this.prepareChartPath(config)

    return await this.chartManager.upgrade(namespace, constants.CHART_FST_DEPLOYMENT_NAME, chartPath, valuesArg)
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
            builder: y => {
              flags.setCommandFlags(y,
                flags.namespace,
                flags.deployMirrorNode,
                flags.deployHederaExplorer,
                flags.deployJsonRpcRelay,
                flags.valuesFile,
                flags.chartDirectory
              )

              return y.command({
                command: 'relay',
                desc: 'Install JSON RPC Relays',
                handler: argv => {
                }
              })
            },
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
