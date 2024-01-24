import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import net from 'net'
import os from 'os'
import path from 'path'
import { v4 as uuid4 } from 'uuid'
import { FullstackTestingError } from '../../../src/core/errors.mjs'
import { ConfigManager, constants, logging, PackageDownloader, Templates } from '../../../src/core/index.mjs'
import { Kubectl2 } from '../../../src/core/kubectl2.mjs'

describe('Kubectl', () => {
  const testLogger = logging.NewLogger('debug')
  const configManager = new ConfigManager(testLogger)
  const kubectl = new Kubectl2(configManager, testLogger)
  const downloader = new PackageDownloader(testLogger)

  it('should be able to list clusters', async () => {
    const clusters = await kubectl.getClusters()
    expect(clusters).not.toHaveLength(0)
    expect(clusters).toContain(constants.CLUSTER_NAME)
  })

  it('should be able to list namespaces', async () => {
    const namespaces = await kubectl.getNamespaces()
    expect(namespaces).not.toHaveLength(0)
    expect(namespaces).toContain(constants.DEFAULT_NAMESPACE)
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
    await expect(kubectl.hasDir(podName, constants.ROOT_CONTAINER, constants.HEDERA_USER_HOME_DIR)).resolves.toBeTruthy()
  })

  it('should be able to copy a file to and from a container', async () => {
    const podName = Templates.renderNetworkPodName('node0')
    const containerName = constants.ROOT_CONTAINER

    //  attempt fetch platform jar as we need to check if a big zip file can be uploaded/downloaded
    const testCacheDir = 'test/data/tmp'
    const tag = 'v0.42.5'
    const releasePrefix = Templates.prepareReleasePrefix(tag)
    const pkgPath = `${testCacheDir}/${releasePrefix}/build-${tag}.zip`
    await expect(downloader.fetchPlatform(tag, testCacheDir)).resolves.toBe(pkgPath)
    expect(fs.existsSync(pkgPath)).toBeTruthy()

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kubectl-'))
    const destDir = constants.HEDERA_USER_HOME_DIR
    const destPath = `${destDir}/build-${tag}.zip`

    // upload the file
    await expect(kubectl.copyTo(podName, containerName, pkgPath, destDir)).resolves.toBeTruthy()

    // download the same file
    await expect(kubectl.copyFrom(podName, containerName, destPath, tmpDir)).resolves.toBeTruthy()

    // rm file inside the container
    await expect(kubectl.execContainer(podName, containerName, ['rm', '-f', destPath])).resolves

    fs.rmdirSync(tmpDir, { recursive: true })
  }, 50000)

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

  it('should be able to run watch for pod', async () => {
    const nodeId = 'node0'
    const labels = [
      'fullstack.hedera.com/type=network-node',
      `fullstack.hedera.com/node-name=${nodeId}`
    ]

    await expect(kubectl.waitForPod(constants.POD_STATUS_RUNNING, labels)).resolves.toBeTruthy()
  })

  it('should be able to cat a log file inside the container', async () => {
    const podName = Templates.renderNetworkPodName('node0')
    const containerName = constants.ROOT_CONTAINER
    const testFileName = 'test.txt'
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kubectl-'))
    const tmpFile = path.join(tmpDir, testFileName)
    const destDir = constants.HEDERA_USER_HOME_DIR
    const destPath = `${destDir}/${testFileName}`
    fs.writeFileSync(tmpFile, 'TEST\nNow current platform status = ACTIVE')

    await expect(kubectl.copyTo(podName, containerName, tmpFile, destDir)).resolves.toBeTruthy()
    const output = await kubectl.execContainer(podName, containerName, ['tail', '-10', destPath])
    expect(output.indexOf('Now current platform status = ACTIVE')).toBeGreaterThan(0)

    fs.rmdirSync(tmpDir, { recursive: true })
  })
})
