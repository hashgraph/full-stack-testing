'use strict'
import { MissingArgumentError } from '../core/errors.mjs'
import { ShellRunner } from '../core/shell_runner.mjs'
import * as flags from './flags.mjs'

export class BaseCommand extends ShellRunner {
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
    if (!opts || !opts.depManager) throw new Error('An instance of core/DependencyManager is required')

    super(opts.logger)

    this.kind = opts.kind
    this.helm = opts.helm
    this.kubectl = opts.kubectl
    this.chartManager = opts.chartManager
    this.configManager = opts.configManager
    this.depManager = opts.depManager
  }
}
