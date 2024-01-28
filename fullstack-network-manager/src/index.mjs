import chalk from 'chalk'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { flags } from './commands/index.mjs'
import * as commands from './commands/index.mjs'
import {
  ChartManager,
  ConfigManager,
  DependencyManager,
  PackageDownloader,
  PlatformInstaller,
  Helm,
  logging,
  KeyManager
} from './core/index.mjs'
import 'dotenv/config'
import { K8 } from './core/k8.mjs'

export function main (argv) {
  const logger = logging.NewLogger('debug')

  try {
    const helm = new Helm(logger)
    const downloader = new PackageDownloader(logger)
    const chartManager = new ChartManager(helm, logger)
    const configManager = new ConfigManager(logger)
    const depManager = new DependencyManager(logger)
    const k8 = new K8(configManager, logger)
    const platformInstaller = new PlatformInstaller(logger, k8)
    const keyManager = new KeyManager(logger)

    // set cluster and namespace in the global configManager from kubernetes context
    // so that we don't need to prompt the user
    const kubeConfig = k8.getKubeConfig()
    const context = kubeConfig.getContextObject(kubeConfig.getCurrentContext())
    const cluster = kubeConfig.getCurrentCluster()
    configManager.setFlag(flags.clusterName, cluster.name)
    if (context.namespace) {
      configManager.setFlag(flags.namespace, context.namespace)
    }
    configManager.persist()

    logger.showUser(chalk.green('\n-------------------------------------------------------------------------------'))
    logger.showUser(chalk.cyan('*** Fullstack Network Manager (FsNetMan) ***'))
    logger.showUser(chalk.cyan('Version\t\t\t:'), chalk.yellow(configManager.getVersion()))
    logger.showUser(chalk.cyan('Kubernetes Context\t:'), chalk.yellow(context.name))
    logger.showUser(chalk.cyan('Kubernetes Cluster\t:'), chalk.yellow(configManager.getFlag(flags.clusterName)))
    logger.showUser(chalk.cyan('Kubernetes Namespace\t:'), chalk.yellow(configManager.getFlag(flags.namespace)))
    logger.showUser(chalk.green('-------------------------------------------------------------------------------\n'))

    const opts = {
      logger,
      helm,
      k8,
      downloader,
      platformInstaller,
      chartManager,
      configManager,
      depManager,
      keyManager
    }

    return yargs(hideBin(argv))
      .usage('Usage:\n  $0 <command> [options]')
      .alias('h', 'help')
      .alias('v', 'version')
      .command(commands.Initialize(opts))
      .strict()
      .option(flags.devMode.name, flags.devMode.definition)
      .wrap(120)
      .demand(1, 'Select a command')
      .parse()
  } catch (e) {
    logger.showUserError(e)
  }
}
