import { describe, expect, it } from '@jest/globals'
import { DependencyManager } from '../../../src/core/dependency_manager.mjs'
import { FullstackTestingError } from '../../../src/core/errors.mjs'
import { logging, constants } from '../../../src/core/index.mjs'

const testLogger = logging.NewLogger('debug')
describe('DependencyManager', () => {
  const depManager = new DependencyManager(testLogger)

  describe('checks', () => {
    it('should succeed with checkKind', async () => {
      await expect(depManager.checkKind()).resolves.toBe(true)
    })

    it('should succeed with checkHelm', async () => {
      await expect(depManager.checkHelm()).resolves.toBe(true)
    })

    it('should succeed with checkKubectl', async () => {
      await expect(depManager.checkKubectl()).resolves.toBe(true)
    })
  })

  describe('checkDependency', () => {
    it('should fail during invalid dependency check', async () => {
      await expect(depManager.checkDependency('INVALID_PROGRAM')).rejects.toThrowError(new FullstackTestingError('INVALID_PROGRAM is not found'))
    })
    it('should succeed during kubectl dependency check', async () => {
      await expect(depManager.checkDependency(constants.KUBECTL)).resolves.toBe(true)
    })
  })
})
