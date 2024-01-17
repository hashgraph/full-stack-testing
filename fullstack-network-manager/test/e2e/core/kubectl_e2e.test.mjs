import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import net from 'net'
import os from 'os'
import path from 'path'
import { v4 as uuid4 } from 'uuid'
import { FullstackTestingError } from '../../../src/core/errors.mjs'
import { ConfigManager, constants, logging, Templates } from '../../../src/core/index.mjs'
import { Kubectl2 } from '../../../src/core/kubectl2.mjs'

describe('Kubectl', () => {
  const testLogger = logging.NewLogger('debug')
  const configManager = new ConfigManager(testLogger)
  const kubectl = new Kubectl2(configManager, testLogger)
  // configManager.load({namespace: constants.NAMESPACE_NAME})

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
    const name = uuid4()
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

  it('should be able to check if a path is directory inside a container', async () => {
    const podName = Templates.renderNetworkPodName('node0')
    await expect(kubectl.hasDir(podName, constants.ROOT_CONTAINER, constants.HEDERA_HAPI_PATH)).resolves.toBeTruthy()
  })

  it('should be able to copy a file to and from a container', async () => {
    const podName = Templates.renderNetworkPodName('node0')
    const containerName = constants.ROOT_CONTAINER
    const testFileName = 'test.txt'
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kubectl-'))
    const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'kubectl-'))
    const tmpFile = path.join(tmpDir, testFileName)
    const destDir = constants.HEDERA_HAPI_PATH
    const destPath = `${destDir}/${testFileName}`
    fs.writeFileSync(tmpFile, 'TEST')

    await expect(kubectl.copyTo(podName, containerName, tmpFile, destDir)).resolves.toBeTruthy()
    await expect(kubectl.hasFile(podName, containerName, destPath)).resolves.toBeTruthy()

    await expect(kubectl.copyFrom(podName, containerName, destPath, tmpDir2)).resolves.toBeTruthy()
    expect(fs.existsSync(`${tmpDir2}/${testFileName}`))

    fs.rmdirSync(tmpDir, { recursive: true })
    fs.rmdirSync(tmpDir2, { recursive: true })
  }, 10000)

  it('should be able to port forward gossip port', (done) => {
    const podName = Templates.renderNetworkPodName('node0')
    const localPort = constants.HEDERA_NODE_INTERNAL_GOSSIP_PORT
    kubectl.portForward(podName, localPort, constants.HEDERA_NODE_INTERNAL_GOSSIP_PORT).then((server) => {
      expect(server).not.toBeNull()

      // client
      const client = new net.Socket()
      client.on('ready', () => {
        client.destroy()
        server.close()
        done()
      })

      client.on('error', (e) => {
        client.destroy()
        server.close()
        done(new FullstackTestingError(`could not connect to local port '${localPort}': ${e.message}`, e))
      })

      client.connect(localPort)
    })
  })
})
