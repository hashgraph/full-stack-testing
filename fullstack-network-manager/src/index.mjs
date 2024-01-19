import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { flags } from './commands/index.mjs'
import * as commands from './commands/index.mjs'
import * as core from './core/index.mjs'
import {
  ChartManager,
  ClusterManager,
  ConfigManager,
  DependencyManager,
  PackageDownloader,
  PlatformInstaller,
  Helm,
  Kind,
  Kubectl,
  logging
} from './core/index.mjs'
import 'dotenv/config'
import { Kubectl2 } from './core/kubectl2.mjs'

export function main (argv) {
  const logger = logging.NewLogger('debug')
  const kind = new Kind(logger)
  const helm = new Helm(logger)
  const kubectl = new Kubectl(logger)
  const downloader = new PackageDownloader(logger)
  const platformInstaller = new PlatformInstaller(logger, kubectl)
  const chartManager = new ChartManager(helm, logger)
  const configManager = new ConfigManager(logger)
  const depManager = new DependencyManager(logger)
  const clusterManager = new ClusterManager(kind, kubectl)
  const kubectl2 = new Kubectl2(configManager, logger)

  const opts = {
    logger,
    kind,
    helm,
    kubectl,
    kubectl2,
    downloader,
    platformInstaller,
    chartManager,
    configManager,
    depManager,
    clusterManager
  }

  logger.debug('Constants: %s', JSON.stringify(core.constants))

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
}
