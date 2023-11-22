import { describe, expect, it, jest } from '@jest/globals'
import { Kubectl, logging } from '../../../src/core/index.mjs'
import { ShellRunner } from '../../../src/core/shell_runner.mjs'
import { FullstackTestingError } from '../../../src/core/errors.mjs'

describe('Kubectl', () => {
  const logger = logging.NewLogger('debug')
  const kubectl = new Kubectl(logger)
  const shellSpy = jest.spyOn(ShellRunner.prototype, 'run').mockImplementation()

  it('should run kubectl create', async () => {
    await kubectl.create('resource', 'arg')
    expect(shellSpy).toHaveBeenCalledWith('kubectl create resource arg')
  })

  it('should run kubectl create ns', async () => {
    await kubectl.createNamespace('namespace')
    expect(shellSpy).toHaveBeenCalledWith('kubectl create ns namespace')
  })

  it('should run kubectl delete', async () => {
    await kubectl.delete('resource', 'arg')
    expect(shellSpy).toHaveBeenCalledWith('kubectl delete resource arg')
  })

  it('should run kubectl delete ns', async () => {
    await kubectl.deleteNamespace('namespace')
    expect(shellSpy).toHaveBeenCalledWith('kubectl delete ns namespace')
  })

  it('should run kubectl get', async () => {
    await kubectl.get('resource', 'arg')
    expect(shellSpy).toHaveBeenCalledWith('kubectl get resource arg')
  })

  it('should run kubectl get ns', async () => {
    await kubectl.getNamespace('namespace')
    expect(shellSpy).toHaveBeenCalledWith('kubectl get ns namespace')
  })

  it('should get IP of a pod', async () => {
    await expect(kubectl.getPodIP('podName')).rejects.toThrow(FullstackTestingError)
    expect(shellSpy).toHaveBeenCalledWith(`kubectl get pod podName -o jsonpath='{.status.podIP}'`)
  })

  it('should get cluster IP of a service', async () => {
    await expect(kubectl.getClusterIP('svcName')).rejects.toThrow(FullstackTestingError)
    expect(shellSpy).toHaveBeenCalledWith(`kubectl get svc svcName -o jsonpath='{.spec.clusterIP}'`)
  })

  it('should run kubectl wait', async () => {
    await kubectl.wait('resource', 'arg')
    expect(shellSpy).toHaveBeenCalledWith('kubectl wait resource arg')
  })

  it('should run kubectl exec', async () => {
    await kubectl.exec('pod', 'arg')
    expect(shellSpy).toHaveBeenCalledWith('kubectl exec pod arg')
  })

  it('should invoke bash command within a container', async () => {
    await kubectl.execContainer('pod', 'container', 'make dir -p test')
    expect(shellSpy).toHaveBeenCalledWith('kubectl exec pod -c container -- bash -c "make dir -p test"')
  })

  it('should run kubectl cp', async () => {
    await kubectl.copy('from', 'to', '-c root-container')
    expect(shellSpy).toHaveBeenCalledWith('kubectl cp from to -c root-container')
  })

  it('should run kubectl config', async () => {
    await kubectl.config('set-context --current --namespace=test')
    expect(shellSpy).toHaveBeenCalledWith('kubectl config set-context --current --namespace=test')
  })

  shellSpy.mockClear()
})
