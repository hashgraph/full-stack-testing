import { expect, it, describe } from '@jest/globals'
import {
  DependencyManager,
  ChartManager,
  ConfigManager,
  Helm,
  logging
} from '../../../src/core/index.mjs'
import { BaseCommand } from '../../../src/commands/base.mjs'
import { K8 } from '../../../src/core/k8.mjs'

const testLogger = logging.NewLogger('debug')

describe('BaseCommand', () => {
  const helm = new Helm(testLogger)
  const chartManager = new ChartManager(helm, testLogger)
  const configManager = new ConfigManager(testLogger)
  const depManager = new DependencyManager(testLogger)
  const k8 = new K8(configManager, testLogger)

  const baseCmd = new BaseCommand({
    logger: testLogger,
    helm,
    k8,
    chartManager,
    configManager,
    depManager
  })

  describe('runShell', () => {
    it('should fail during invalid program check', async () => {
      await expect(baseCmd.run('INVALID_PROGRAM')).rejects.toThrowError()
    })
    it('should succeed during valid program check', async () => {
      await expect(baseCmd.run('date')).resolves.not.toBeNull()
    })
  })
})
