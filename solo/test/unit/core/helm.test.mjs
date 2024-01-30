import { describe, expect, it, jest } from '@jest/globals'
import { Helm, logging } from '../../../src/core/index.mjs'
import { ShellRunner } from '../../../src/core/shell_runner.mjs'

describe('Helm', () => {
  const logger = logging.NewLogger('debug')
  const helm = new Helm(logger)
  const shellSpy = jest.spyOn(ShellRunner.prototype, 'run').mockImplementation()

  it('should run helm install', async () => {
    await helm.install('arg')
    expect(shellSpy).toHaveBeenCalledWith('helm install arg', true)
  })

  it('should run helm uninstall', async () => {
    await helm.uninstall('arg')
    expect(shellSpy).toHaveBeenCalledWith('helm uninstall arg')
  })

  it('should run helm upgrade', async () => {
    await helm.upgrade('release', 'chart')
    expect(shellSpy).toHaveBeenCalledWith('helm upgrade release chart')
  })

  it('should run helm list', async () => {
    await helm.list()
    expect(shellSpy).toHaveBeenCalledWith('helm list')
  })

  it('should run helm dependency', async () => {
    await helm.dependency('update', 'chart')
    expect(shellSpy).toHaveBeenCalledWith('helm dependency update chart')
  })

  it('should run helm repo', async () => {
    await helm.repo('add', 'name', 'url')
    expect(shellSpy).toHaveBeenCalledWith('helm repo add name url')
  })

  shellSpy.mockClear()
})
