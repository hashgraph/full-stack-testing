import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import * as commands from './commands/index.mjs'
import * as core from './core/index.mjs'
import { ChartManager, ConfigManager, DependencyManager, KeyManager } from './core/index.mjs'
import 'dotenv/config'

export function main (argv) {
  const logger = core.logging.NewLogger('debug')
  const kind = new core.Kind(logger)
  const helm = new core.Helm(logger)
  const kubectl = new core.Kubectl(logger)
  const downloader = new core.PackageDownloader(logger)
  const platformInstaller = new core.PlatformInstaller(logger, kubectl)
  const chartManager = new ChartManager(helm, logger)
  const configManager = new ConfigManager(logger)
  const depManager = new DependencyManager(logger)
  const keyManager = new KeyManager(logger)

  const opts = {
    logger,
    kind,
    helm,
    kubectl,
    downloader,
    platformInstaller,
    chartManager,
    configManager,
    depManager,
    keyManager
  }

  logger.debug('Constants: %s', JSON.stringify(core.constants))

  return yargs(hideBin(argv))
    .usage('Usage:\n  $0 <command> [options]')
    .alias('h', 'help')
    .alias('v', 'version')
    .command(commands.Initialize(opts))
    .strict()
    .wrap(120)
    .demand(1, 'Select a command')
    .parse()
}
