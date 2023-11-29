import { InitCommand } from '../../../src/commands/init.mjs'
import { expect, describe, it } from '@jest/globals'
import * as core from '../../../src/core/index.mjs'
import { ChartManager, ConfigManager, Helm, Kind, Kubectl } from '../../../src/core/index.mjs'

const testLogger = core.logging.NewLogger('debug')
describe('InitCommand', () => {
  const kind = new Kind(testLogger)
  const helm = new Helm(testLogger)
  const kubectl = new Kubectl(testLogger)
  const chartManager = new ChartManager(helm, testLogger)
  const configManager = new ConfigManager(testLogger)
  const depManager = new ConfigManager(testLogger)

  const initCmd = new InitCommand({
    logger: testLogger,
    kind,
    helm,
    kubectl,
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
