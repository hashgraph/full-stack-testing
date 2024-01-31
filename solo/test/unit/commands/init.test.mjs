import { InitCommand } from '../../../src/commands/init.mjs'
import { expect, describe, it } from '@jest/globals'
import {
  ChartManager,
  ConfigManager,
  DependencyManager,
  Helm,
  KeyManager,
  logging
} from '../../../src/core/index.mjs'
import { K8 } from '../../../src/core/k8.mjs'

const testLogger = logging.NewLogger('debug')
describe('InitCommand', () => {
  const helm = new Helm(testLogger)
  const chartManager = new ChartManager(helm, testLogger)
  const configManager = new ConfigManager(testLogger)
  const depManager = new DependencyManager(testLogger)
  const keyManager = new KeyManager(testLogger)
  const k8 = new K8(configManager, testLogger)

  const initCmd = new InitCommand({
    logger: testLogger,
    helm,
    k8,
    chartManager,
    configManager,
    depManager,
    keyManager
  })

  describe('commands', () => {
    it('init execution should succeed', async () => {
      await expect(initCmd.init({})).resolves.toBe(true)
    }, 20000)
  })

  describe('static', () => {
    it('command definition should return a valid command def', async () => {
      const def = InitCommand.getCommandDefinition(initCmd)
      expect(def.name).not.toBeNull()
      expect(def.desc).not.toBeNull()
      expect(def.handler).not.toBeNull()
    })
  })
})
