import {constants} from './index.mjs'
import chalk from 'chalk'
import {FullstackTestingError} from './errors.mjs'

export class ChartManager {
  constructor(helm, logger) {
    if (!logger) throw new Error('An instance of core/Logger is required')
    if (!helm) throw new Error('An instance of core/Helm is required')

    this.logger = logger
    this.helm = helm
  }

  /**
   * Setup chart repositories
   *
   * This must be invoked before calling other methods
   *
   * @param repoURLs a map of name and chart repository URLs
   * @param force whether or not to update the repo
   * @returns {Promise<string[]>}
   */
  async setup(repoURLs = constants.DEFAULT_CHART_REPO, force = true) {
    try {
      let forceUpdateArg = ''
      if (force) {
        forceUpdateArg = '--force-update'
      }

      const urls = []
      for (const [name, url] of repoURLs.entries()) {
        this.logger.debug(`Adding repo ${name} -> ${url}`, {repoName: name, repoURL: url})
        await this.helm.repo('add', name, url, forceUpdateArg)
        urls.push(url)
      }

      return urls
    } catch (e) {
      throw new FullstackTestingError(`failed to setup chart repositories: ${e.message}`, e)
    }
  }

  /**
   * List available clusters
   * @returns {Promise<string[]>}
   */
  async getInstalledCharts(namespaceName) {
    try {
      return await this.helm.list(`-n ${namespaceName}`, '--no-headers | awk \'{print $9}\'')
    } catch (e) {
      this.logger.showUserError(e)
    }

    return []
  }

  async install(namespaceName, chartName, chartPath, version, valuesArg = '') {
    try {
      const isInstalled = await this.isChartInstalled(namespaceName, chartName)
      if (!isInstalled) {
        let versionArg = ''
        if (version) {
          versionArg = `--version ${version}`
        }

        let namespaceArg = ''
        if (namespaceName) {
          namespaceArg = `-n ${namespaceName}`
        }

        this.logger.showUser(chalk.cyan('> installing chart:'), chalk.yellow(`${chartPath}`))
        await this.helm.install(`${chartName} ${chartPath} ${versionArg} ${namespaceArg} ${valuesArg}`)
        this.logger.showUser(chalk.green('OK'), `chart '${chartPath}' is installed`)
      } else {
        this.logger.showUser(chalk.green('OK'), `chart '${chartPath}' is already installed`)
      }

      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  async isChartInstalled(namespaceName, chartName) {
    const charts = await this.getInstalledCharts(namespaceName)
    for (const item of charts) {
      if (item.startsWith(chartName)) return true
    }

    return false
  }

  async uninstall(namespaceName, chartName) {
    try {
      this.logger.showUser(chalk.cyan('> checking chart:'), chalk.yellow(`${chartName}`))
      const isInstalled = await this.isChartInstalled(namespaceName, chartName)
      if (isInstalled) {
        this.logger.showUser(chalk.cyan('> uninstalling chart:'), chalk.yellow(`${chartName}`))
        await this.helm.uninstall(`-n ${namespaceName} ${chartName}`)
        this.logger.showUser(chalk.green('OK'), `chart '${chartName}' is uninstalled`)
      } else {
        this.logger.showUser(chalk.green('OK'), `chart '${chartName}' is already uninstalled`)
      }

      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }

  async upgrade(namespaceName, chartName, chartPath, valuesArg = '') {
    try {
      this.logger.showUser(chalk.cyan('> upgrading chart:'), chalk.yellow(`${chartName}`))
      await this.helm.upgrade(`-n ${namespaceName} ${chartName} ${chartPath} ${valuesArg}`)
      this.logger.showUser(chalk.green('OK'), `chart '${chartName}' is upgraded`)

      return true
    } catch (e) {
      this.logger.showUserError(e)
    }

    return false
  }
}
