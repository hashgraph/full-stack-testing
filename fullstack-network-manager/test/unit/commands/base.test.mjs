import { expect, it, describe } from '@jest/globals'
import { DependencyManager, ChartManager, ConfigManager, Helm, Kubectl, logging } from '../../../src/core/index.mjs'
import { BaseCommand } from '../../../src/commands/base.mjs'
import { Kind } from '../../../src/core/kind.mjs'

const testLogger = logging.NewLogger('debug')

describe('BaseCommand', () => {
  const kind = new Kind(testLogger)
  const helm = new Helm(testLogger)
  const kubectl = new Kubectl(testLogger)
  const chartManager = new ChartManager(helm, testLogger)
  const configManager = new ConfigManager(testLogger)
  const depManager = new DependencyManager(testLogger)

  const baseCmd = new BaseCommand({
    logger: testLogger,
    kind,
    helm,
    kubectl,
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
