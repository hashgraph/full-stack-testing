'use strict'
import { MissingArgumentError } from '../core/errors.mjs'
import * as core from '../core/index.mjs'
import chalk from 'chalk'
import { ShellRunner } from '../core/shell_runner.mjs'
import * as flags from './flags.mjs'

export class BaseCommand extends ShellRunner {
  async checkDep (cmd) {
    try {
      this.logger.debug(cmd)
      await this.run(cmd)
    } catch (e) {
      this.logger.showUserError(e)
      return false
    }

    return true
  }

  /**
     * Check if 'kind' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
  async checkKind () {
    return this.checkDep(`${core.constants.KIND} --version`)
  }

  /**
     * Check if 'helm' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
  async checkHelm () {
    return this.checkDep(`${core.constants.HELM} version`)
  }

  /**
     * Check if 'kubectl' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
  async checkKubectl () {
    return this.checkDep(`${core.constants.KUBECTL} version --client`)
  }

  /**
     * Check if all the required dependencies are installed or not
     * @param deps is a list of dependencies
     * @returns {Promise<boolean>}
     */
  async checkDependencies (deps = []) {
    this.logger.debug('Checking for required dependencies: %s', deps)

    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i]
      this.logger.debug("Checking for dependency '%s'", dep)

      let status = false
      const check = this.checks.get(dep)
      if (check) {
        status = await check()
      }

      if (!status) {
        this.logger.showUser(chalk.red(`FAIL: '${dep}' is not found`))
        return false
      }

      this.logger.showUser(chalk.green(`OK: '${dep}' is found`))
    }

    this.logger.debug('All required dependencies are found: %s', deps)

    return true
  }

  async prepareChartPath (config, chartRepo, chartName) {
    if (!config) throw new MissingArgumentError('config is required')
    if (!chartRepo) throw new MissingArgumentError('chart repo name is required')
    if (!chartName) throw new MissingArgumentError('chart name is required')

    const chartDir = this.configManager.flagValue(config, flags.chartDirectory)
    if (chartDir) {
      const chartPath = `${chartDir}/${chartName}`
      await this.helm.dependency('update', chartPath)
      return chartPath
    }

    return `${chartRepo}/${chartName}`
  }

  constructor (opts) {
    if (!opts || !opts.logger) throw new Error('An instance of core/Logger is required')
    if (!opts || !opts.kind) throw new Error('An instance of core/Kind is required')
    if (!opts || !opts.helm) throw new Error('An instance of core/Helm is required')
    if (!opts || !opts.kubectl) throw new Error('An instance of core/Kubectl is required')
    if (!opts || !opts.chartManager) throw new Error('An instance of core/ChartManager is required')
    if (!opts || !opts.configManager) throw new Error('An instance of core/ConfigManager is required')

    super(opts.logger)

    this.kind = opts.kind
    this.helm = opts.helm
    this.kubectl = opts.kubectl
    this.chartManager = opts.chartManager
    this.configManager = opts.configManager

    // map of dependency checks
    this.checks = new Map()
      .set(core.constants.KIND, () => this.checkKind())
      .set(core.constants.HELM, () => this.checkHelm())
      .set(core.constants.KUBECTL, () => this.checkKubectl())
  }
}
