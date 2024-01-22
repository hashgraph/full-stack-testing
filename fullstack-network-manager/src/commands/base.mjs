'use strict'
import { MissingArgumentError } from '../core/errors.mjs'
import { ShellRunner } from '../core/shell_runner.mjs'

export class BaseCommand extends ShellRunner {
  async prepareChartPath (chartDir, chartRepo, chartName) {
    if (!chartRepo) throw new MissingArgumentError('chart repo name is required')
    if (!chartName) throw new MissingArgumentError('chart name is required')

    if (chartDir) {
      const chartPath = `${chartDir}/${chartName}`
      await this.helm.dependency('update', chartPath)
      return chartPath
    }

    return `${chartRepo}/${chartName}`
  }

  constructor (opts) {
    if (!opts || !opts.logger) throw new Error('An instance of core/Logger is required')
    if (!opts || !opts.helm) throw new Error('An instance of core/Helm is required')
    if (!opts || !opts.kubectl) throw new Error('An instance of core/Kubectl is required')
    if (!opts || !opts.kubectl2) throw new Error('An instance of core/Kubectl2 is required')
    if (!opts || !opts.chartManager) throw new Error('An instance of core/ChartManager is required')
    if (!opts || !opts.configManager) throw new Error('An instance of core/ConfigManager is required')
    if (!opts || !opts.depManager) throw new Error('An instance of core/DependencyManager is required')

    super(opts.logger)

    this.helm = opts.helm
    this.kubectl = opts.kubectl
    this.kubectl2 = opts.kubectl2
    this.chartManager = opts.chartManager
    this.configManager = opts.configManager
    this.depManager = opts.depManager
  }
}
