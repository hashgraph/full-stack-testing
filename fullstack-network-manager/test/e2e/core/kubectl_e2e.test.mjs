import {describe, expect, it} from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import {FullstackTestingError} from "../../../src/core/errors.mjs";
import {constants, Templates} from "../../../src/core/index.mjs";
import {Kubectl2} from "../../../src/core/kubectl2.mjs";
import {v4 as uuidv4} from 'uuid'

describe('Kubectl', () => {
  const kubectl = new Kubectl2()
  // kubectl.setCurrentContext(constants.CONTEXT_NAME)
  kubectl.setCurrentNamespace(constants.NAMESPACE_NAME)

  it('should be able to list clusters', async () => {
    const clusters = await kubectl.getClusters()
    expect(clusters).not.toHaveLength(0)
    expect(clusters).toContain(constants.CLUSTER_NAME)
  })

  it('should be able to list namespaces', async () => {
    const namespaces = await kubectl.getNamespaces()
    expect(namespaces).not.toHaveLength(0)
    expect(namespaces).toContain(constants.NAMESPACE_NAME)
  })

  it('should be able to list contexts', async () => {
    const contexts = await kubectl.getContexts()
    expect(contexts).not.toHaveLength(0)
    expect(contexts).toContain(constants.CONTEXT_NAME)
  })

  it('should be able to create and delete a namespaces', async () => {
    const name = uuidv4()
    await expect(kubectl.createNamespace(name)).resolves.toBeTruthy()
    await expect(kubectl.deleteNamespace(name)).resolves.toBeTruthy()
  })

  it('should be able to detect pod IP of a pod', async () => {
    const podName = Templates.renderNetworkPodName('node0')
    await expect(kubectl.getPodIP(podName)).resolves.not.toBeNull()
    await expect(kubectl.getPodIP('INVALID')).rejects.toThrow(FullstackTestingError)
  })

  it('should be able to detect cluster IP', async () => {
    const svcName = Templates.renderNetworkSvcName('node0')
    await expect(kubectl.getClusterIP(svcName)).resolves.not.toBeNull()
    await expect(kubectl.getClusterIP('INVALID')).rejects.toThrow(FullstackTestingError)
  })

  it('should be able to copy a file into a container', async () => {
    const podName = Templates.renderNetworkPodName('node0')
    const containerName = constants.ROOT_CONTAINER
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kubectl-'))
    const tmpFile = path.join(tmpDir, 'test.txt')
    fs.writeFileSync(tmpFile, "TEST")

    await expect(kubectl.copy(podName, containerName, tmpFile, `/tmp/dummy.txt`, tmpDir)).resolves.toBeTruthy()

    fs.rmdirSync(tmpDir, {recursive: true})
  })
})
