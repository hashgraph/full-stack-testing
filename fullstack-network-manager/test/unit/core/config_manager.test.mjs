import { describe, expect, it } from '@jest/globals'
import { ConfigManager, logging } from '../../../src/core/index.mjs'
import * as flags from '../../../src/commands/flags.mjs'
import { v4 as uuid4 } from 'uuid'
describe('ConfigManager', () => {
  const testLogger = logging.NewLogger('debug')
  const cm = new ConfigManager(testLogger)
  it('should be able to load cached config file', () => {
    cm.load()
    expect(cm.config).not.toBeNull()
    expect(cm.config.version).not.toBeNull()
    expect(cm.config.flags).not.toBeNull()
    expect(cm.config.updatedAt).not.toBeNull()
  })

  it('should be able to refresh config from argv', () => {
    cm.load()
    expect(cm.config).not.toBeNull()
    expect(cm.config.version).not.toBeNull()
    expect(cm.config.flags).not.toBeNull()
    expect(cm.config.updatedAt).not.toBeNull()

    const previousNamespace = cm.flagValue(flags.namespace)
    const previousUpdatedAt = cm.config.updatedAt

    const argv = {}
    argv[flags.namespace.name] = uuid4()
    cm.load(argv)
    expect(cm.flagValue(flags.namespace)).not.toBe(previousNamespace)
    expect(cm.flagValue(flags.namespace)).toBe(argv[flags.namespace.name])
    expect(cm.config.updatedAt).not.toBe(previousUpdatedAt)
  })
})
