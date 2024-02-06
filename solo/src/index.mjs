/**
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the ""License"");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an ""AS IS"" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
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
    configManager.load()
    configManager.setFlag(flags.clusterName, cluster.name)
    if (context.namespace) {
      configManager.setFlag(flags.namespace, context.namespace)
    }
    configManager.persist()

    logger.showUser(chalk.cyan('\n******************************* Solo *********************************************'))
    logger.showUser(chalk.cyan('Version\t\t\t:'), chalk.yellow(configManager.getVersion()))
    logger.showUser(chalk.cyan('Kubernetes Context\t:'), chalk.yellow(context.name))
    logger.showUser(chalk.cyan('Kubernetes Cluster\t:'), chalk.yellow(configManager.getFlag(flags.clusterName)))
    logger.showUser(chalk.cyan('Kubernetes Namespace\t:'), chalk.yellow(configManager.getFlag(flags.namespace)))
    logger.showUser(chalk.cyan('**********************************************************************************'))

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

    const processArguments = (args, yargs) => {
      if (args._[0] === 'init') {
        configManager.load({}, true) // reset cached config
      } else {
        configManager.load()
      }

      for (const key of Object.keys(yargs.parsed.aliases)) {
        const flag = flags.allFlagsMap.get(key)
        if (flag) {
          if (args[key] !== undefined) {
            // argv takes precedence, nothing to do
          } else if (configManager.hasFlag(flag)) {
            args[key] = configManager.getFlag(flag)
          } else if (args._[0] !== 'init') {
            args[key] = flag.definition.defaultValue
          }
        }
      }
      return args
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
      .middleware(processArguments, true)
      .parse()
  } catch (e) {
    logger.showUserError(e)
  }
}
