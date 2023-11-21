import chalk from 'chalk'
import {DataValidationError, FullstackTestingError, MissingArgumentError} from '../core/errors.mjs'
import { BaseCommand } from './base.mjs'
import * as flags from './flags.mjs'
import * as paths from 'path'
import { constants } from '../core/index.mjs'

export class RelayCommand extends BaseCommand {
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

  async install (argv) {
    try {
      const config = await this.configManager.setupConfig(argv)
      const namespace = this.configManager.flagValue(config, flags.namespace)

      let valuesFile = this.configManager.flagValue(config, flags.valuesFile)
      if (!valuesFile) {
        valuesFile = `${constants.RESOURCES_DIR}/templates/values/json-rpc-relay.yaml`
      }

      const valuesArg = this.prepareValuesFiles(valuesFile)
      const chartPath = await this.prepareChartPath(config, constants.CHART_JSON_RPC_RELAY_REPO_NAME, constants.CHART_JSON_RPC_RELAY_NAME)

      await this.chartManager.install(namespace, constants.CHART_JSON_RPC_RELAY_NAME, chartPath, '', valuesArg)

      this.logger.showUser(chalk.cyan('> waiting for hedera-json-rpc-relay to be ready...'))
      await this.kubectl.wait('pod',
        '--for=condition=ready',
        '-l app=hedera-json-rpc-relay',
        '--timeout=900s'
      )
      this.logger.showUser(chalk.green('OK'), 'hedera-json-rpc-relay pods are running')
      this.logger.showList('Deployed Relays', await this.chartManager.getInstalledCharts(namespace))
      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  async uninstall (argv) {
    const namespace = argv.namespace
    return await this.chartManager.uninstall(namespace, constants.CHART_JSON_RPC_RELAY_NAME)
  }

  static getCommandDefinition (chartCmd) {
    return {
      command: 'relay',
      desc: 'Manage JSON RPC relays',
      builder: yargs => {
        return yargs
          .command({
            command: 'install',
            desc: 'Install a JSON RPC relay',
            builder: y => {
              flags.setCommandFlags(y,
                flags.namespace,
                flags.valuesFile,
                flags.chartDirectory
              )
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
            desc: 'Uninstall JSON RPC relay',
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
          .demandCommand(1, 'Select a chart command')
      }
    }
  }
}
