import { describe, expect, it, jest } from '@jest/globals'
import { Kind, logging } from '../../../src/core/index.mjs'
import { ShellRunner } from '../../../src/core/shell_runner.mjs'

describe('Kind', () => {
  const logger = logging.NewLogger('debug')
  const kind = new Kind(logger)
  const shellSpy = jest.spyOn(ShellRunner.prototype, 'run').mockImplementation()

  it('should run kind create', async () => {
    expect(shellSpy).toHaveBeenCalledWith('kind create resource arg')
  })

  it('should run kind create cluster', async () => {
    await kind.createCluster('test', 'arg')
    expect(shellSpy).toHaveBeenCalledWith('kind create cluster -n test arg')
  })

  it('should run kind delete', async () => {
    await kind.delete('resource', 'arg')
    expect(shellSpy).toHaveBeenCalledWith('kind delete resource arg')
  })

  it('should run kind delete cluster', async () => {
    await kind.deleteCluster('test')
    expect(shellSpy).toHaveBeenCalledWith('kind delete cluster -n test')
  })

  it('should run kind get', async () => {
    await kind.get('resource', 'arg')
    expect(shellSpy).toHaveBeenCalledWith('kind get resource arg')
  })

  it('should run kind get clusters', async () => {
    await kind.getClusters('arg')
    expect(shellSpy).toHaveBeenCalledWith('kind get clusters arg')
  })

  it('should run kind get nodes', async () => {
    await kind.getNodes('arg')
    expect(shellSpy).toHaveBeenCalledWith('kind get nodes arg')
  })

  it('should run kind get kubeconfig', async () => {
    await kind.getKubeconfig('arg')
    expect(shellSpy).toHaveBeenCalledWith('kind get kubeconfig arg')
  })

  shellSpy.mockClear()
})
