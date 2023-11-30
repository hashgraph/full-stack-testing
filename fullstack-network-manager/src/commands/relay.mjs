import chalk from 'chalk'
import { MissingArgumentError } from '../core/errors.mjs'
import { BaseCommand } from './base.mjs'
import * as flags from './flags.mjs'
import * as paths from 'path'
import { constants } from '../core/index.mjs'

export class RelayCommand extends BaseCommand {
  prepareValuesArg (config) {
    const valuesFile = this.configManager.flagValue(config, flags.valuesFile)

    let valuesArg = ''
    if (valuesFile) {
      const valuesFiles = valuesFile.split(',')
      valuesFiles.forEach(vf => {
        const vfp = paths.resolve(vf)
        valuesArg += ` --values ${vfp}`
      })
    }

    valuesArg += ` --set config.MIRROR_NODE_URL=${constants.CHART_FST_DEPLOYMENT_NAME}-rest`

    const chainID = this.configManager.flagValue(config, flags.chainId)
    if (chainID) {
      valuesArg += ` --set config.CHAIN_ID=${chainID}`
    }

    const releaseTag = this.configManager.flagValue(config, flags.releaseTag)
    if (releaseTag) {
      valuesArg += ` --set image.tag=${releaseTag.replace(/^v/, '')}`
    }

    const replicaCount = this.configManager.flagValue(config, flags.replicaCount)
    if (replicaCount) {
      valuesArg += ` --set replicaCount=${replicaCount}`
    }

    const operatorId = this.configManager.flagValue(config, flags.operatorId)
    if (operatorId) {
      valuesArg += ` --set config.OPERATOR_ID_MAIN=${operatorId}`
    }

    const operatorKey = this.configManager.flagValue(config, flags.operatorKey)
    if (operatorKey) {
      valuesArg += ` --set config.OPERATOR_KEY_MAIN=${operatorKey}`
    }

    const nodeIDs = this.configManager.flagValue(config, flags.nodeIDs)
    if (!nodeIDs) {
      throw new MissingArgumentError('Node IDs must be specified')
    }

    nodeIDs.split(',').forEach(nodeID => {
      const networkKey = `network-${nodeID.trim()}-0-svc:50211`
      valuesArg += ` --set config.HEDERA_NETWORK.${networkKey}=0.0.3`
    })

    return valuesArg
  }

  prepareReleaseName (config) {
    const nodeIDs = this.configManager.flagValue(config, flags.nodeIDs)
    if (!nodeIDs) {
      throw new MissingArgumentError('Node IDs must be specified')
    }

    let releaseName = 'relay'
    nodeIDs.split(',').forEach(nodeID => {
      releaseName += `-${nodeID}`
    })

    return releaseName
  }

  async install (argv) {
    try {
      const config = await this.configManager.setupConfig(argv)
      const chartDir = this.configManager.flagValue(config, flags.chartDirectory)
      const namespace = this.configManager.flagValue(config, flags.namespace)
      const valuesArg = this.prepareValuesArg(config)
      const chartPath = await this.prepareChartPath(chartDir, constants.CHART_JSON_RPC_RELAY_REPO_NAME, constants.CHART_JSON_RPC_RELAY_NAME)
      const releaseName = this.prepareReleaseName(config)

      await this.chartManager.install(namespace, releaseName, chartPath, '', valuesArg)

      this.logger.showUser(chalk.cyan(`> waiting for ${releaseName} pods to be ready...`))
      await this.kubectl.wait('pod',
        '--for=condition=ready',
        '-l app=hedera-json-rpc-relay',
        `-l app.kubernetes.io/instance=${releaseName}`,
        '--timeout=900s'
      )
      this.logger.showUser(chalk.green('OK'), `${releaseName} pods are ready`)
      this.logger.showList('Deployed Relays', await this.chartManager.getInstalledCharts(namespace))
      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  async uninstall (argv) {
    const config = await this.configManager.setupConfig(argv)
    const namespace = this.configManager.flagValue(config, flags.namespace)
    const releaseName = this.prepareReleaseName(config)
    return await this.chartManager.uninstall(namespace, releaseName)
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
                flags.chartDirectory,
                flags.replicaCount,
                flags.chainId,
                flags.nodeIDs,
                flags.releaseTag,
                flags.operatorId,
                flags.operatorKey
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
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.nodeIDs
            ),
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
