import { expect, it, describe } from '@jest/globals'
import {
  DependencyManager,
  ChartManager,
  ConfigManager,
  Helm,
  logging
} from '../../../src/core/index.mjs'
import { BaseCommand } from '../../../src/commands/base.mjs'
import { Kubectl2 } from '../../../src/core/kubectl2.mjs'

const testLogger = logging.NewLogger('debug')

describe('BaseCommand', () => {
  const helm = new Helm(testLogger)
  const chartManager = new ChartManager(helm, testLogger)
  const configManager = new ConfigManager(testLogger)
  const depManager = new DependencyManager(testLogger)
  const kubectl2 = new Kubectl2(configManager, testLogger)

  const baseCmd = new BaseCommand({
    logger: testLogger,
    helm,
    kubectl2,
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
