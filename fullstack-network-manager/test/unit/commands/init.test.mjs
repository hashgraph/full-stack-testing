import { InitCommand } from '../../../src/commands/init.mjs'
import { expect, describe, it } from '@jest/globals'
import * as core from '../../../src/core/index.mjs'
import {
  ChartManager,
  ConfigManager,
  DependencyManager,
  Helm
} from '../../../src/core/index.mjs'
import { Kubectl2 } from '../../../src/core/kubectl2.mjs'

const testLogger = core.logging.NewLogger('debug')
describe('InitCommand', () => {
  const helm = new Helm(testLogger)
  const chartManager = new ChartManager(helm, testLogger)
  const configManager = new ConfigManager(testLogger)
  const depManager = new DependencyManager(testLogger)
  const kubectl2 = new Kubectl2(configManager, testLogger)

  const initCmd = new InitCommand({
    logger: testLogger,
    helm,
    kubectl2,
    chartManager,
    configManager,
    depManager
  })

  describe('commands', () => {
    it('init execution should succeed', async () => {
      await expect(initCmd.init({})).resolves.toBe(true)
    })
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
