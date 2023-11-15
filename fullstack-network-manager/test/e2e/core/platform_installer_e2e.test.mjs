import { describe, expect, it } from '@jest/globals'
import { PackageDownloader, PlatformInstaller, constants, logging, Kubectl } from '../../../src/core/index.mjs'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('PackageInstallerE2E', () => {
  const testLogger = logging.NewLogger('debug')
  const kubectl = new Kubectl(testLogger)
  const installer = new PlatformInstaller(testLogger, kubectl)
  const downloader = new PackageDownloader(testLogger)
  const podName = 'network-node0-0'
  const packageTag = 'v0.42.5'
  let packageFile = ''

  describe('setupHapiDirectories', () => {
    it('should succeed with valid pod', async () => {
      expect.assertions(1)
      try {
        await expect(installer.setupHapiDirectories(podName)).resolves.toBeTruthy()
      } catch (e) {
        console.error(e)
        expect(e).toBeNull()
      }
    })
  })

  describe('copyPlatform', () => {
    it('should succeed with valid tag and pod', async () => {
      expect.assertions(1)
      try {
        const tmpDir = 'test/data/tmp'
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir)
        }
        packageFile = await downloader.fetchPlatform(packageTag, tmpDir)
        await expect(installer.copyPlatform(podName, packageFile, true)).resolves.toBeTruthy()
        const outputs = await kubectl.execContainer(podName, constants.ROOT_CONTAINER, `ls -la ${constants.HAPI_PATH}`)
        testLogger.showUser(outputs)
      } catch (e) {
        console.error(e)
        expect(e).toBeNull()
      }
    })
  })

  describe('prepareConfigTxt', () => {
    it('should succeed in generating config.txt', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'downloader-'))
      const configPath = `${tmpDir}/config.txt`
      const nodeIDs = ['node0', 'node1', 'node2']
      const releaseTag = 'v0.42.0'

      const configLines = await installer.prepareConfigTxt(nodeIDs, configPath, releaseTag)

      // verify format is correct
      expect(configLines.length).toBe(6)
      expect(configLines[0]).toBe(`swirld, ${constants.CLUSTER_NAME}`)
      expect(configLines[1]).toBe(`app, ${constants.HEDERA_APP_JAR}`)
      expect(configLines[2]).toContain('address, 0, node0, node0, 1')
      expect(configLines[3]).toContain('address, 1, node1, node1, 1')
      expect(configLines[4]).toContain('address, 2, node2, node2, 1')
      expect(configLines[5]).toBe('nextNodeId, 3')

      // verify the file exists
      expect(fs.existsSync(configPath)).toBeTruthy()
      const fileContents = fs.readFileSync(configPath).toString()

      // verify file content matches
      expect(fileContents).toBe(configLines.join('\n'))

      fs.rmdirSync(tmpDir, { recursive: true })
    })
  })

  describe('prepareStaging', () => {
    it('should succeed in preparing staging area', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'downloader-'))
      const configPath = `${tmpDir}/config.txt`
      const nodeIDs = ['node0', 'node1', 'node2']
      const releaseTag = 'v0.42.0'

      await expect(installer.prepareStaging(nodeIDs, tmpDir, releaseTag)).resolves.toBeTruthy()

      // verify the config.txt exists
      expect(fs.existsSync(configPath)).toBeTruthy()

      // verify copy of local-node data is at staging area
      expect(fs.existsSync(`${tmpDir}/templates`)).toBeTruthy()

      fs.rmdirSync(tmpDir, { recursive: true })
    })
  })

  describe('copyGossipKeys', () => {
    it('should succeed to copy gossip keys for node0', async () => {
      const stagingDir = `${constants.RESOURCES_DIR}` // just use the resource directory rather than creating staging area
      const podName = 'network-node0-0'
      await installer.setupHapiDirectories(podName)

      const fileList = await installer.copyGossipKeys(podName, stagingDir)
      expect(fileList.length).toBe(2)
      expect(fileList).toContain(`${constants.HAPI_PATH}/data/keys/private-node0.pfx`)
      expect(fileList).toContain(`${constants.HAPI_PATH}/data/keys/public.pfx`)
    })

    it('should succeed to copy gossip keys for node1', async () => {
      const stagingDir = `${constants.RESOURCES_DIR}` // just use the resource directory rather than creating staging area
      const podName = 'network-node1-0'
      await installer.setupHapiDirectories(podName)

      const fileList = await installer.copyGossipKeys(podName, stagingDir)
      expect(fileList.length).toBe(2)
      expect(fileList).toContain(`${constants.HAPI_PATH}/data/keys/private-node1.pfx`)
      expect(fileList).toContain(`${constants.HAPI_PATH}/data/keys/public.pfx`)
    })
  })

  describe('copyTLSKeys', () => {
    it('should succeed to copy TLS keys for node0', async () => {
      const stagingDir = `${constants.RESOURCES_DIR}` // just use the resource directory rather than creating staging area
      const podName = 'network-node0-0'
      await installer.setupHapiDirectories(podName)

      const fileList = await installer.copyTLSKeys(podName, stagingDir)
      expect(fileList.length).toBe(3) // [data , hedera.crt, hedera.key]
      expect(fileList.length).toBeGreaterThanOrEqual(2)
      expect(fileList).toContain(`${constants.HAPI_PATH}/hedera.crt`)
      expect(fileList).toContain(`${constants.HAPI_PATH}/hedera.key`)
    })

    it('should succeed to copy TLS keys for node1', async () => {
      const stagingDir = `${constants.RESOURCES_DIR}` // just use the resource directory rather than creating staging area
      const podName = 'network-node1-0'
      await installer.setupHapiDirectories(podName)

      const fileList = await installer.copyTLSKeys(podName, stagingDir)
      expect(fileList.length).toBe(3) // [data , hedera.crt, hedera.key]
      expect(fileList).toContain(`${constants.HAPI_PATH}/hedera.crt`)
      expect(fileList).toContain(`${constants.HAPI_PATH}/hedera.key`)
    })
  })

  describe('copyPlatformConfigFiles', () => {
    it('should succeed to copy platform config files for node0', async () => {
      const podName = 'network-node0-0'
      await installer.setupHapiDirectories(podName)

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'downloader-'))
      const nodeIDs = ['node0']
      const releaseTag = 'v0.42.0'
      await installer.prepareStaging(nodeIDs, tmpDir, releaseTag)

      const fileList = await installer.copyPlatformConfigFiles(podName, tmpDir)
      expect(fileList.length).toBeGreaterThanOrEqual(6)
      expect(fileList).toContain(`${constants.HAPI_PATH}/config.txt`)
      expect(fileList).toContain(`${constants.HAPI_PATH}/log4j2.xml`)
      expect(fileList).toContain(`${constants.HAPI_PATH}/settings.txt`)
      expect(fileList).toContain(`${constants.HAPI_PATH}/data/config/api-permission.properties`)
      expect(fileList).toContain(`${constants.HAPI_PATH}/data/config/application.properties`)
      expect(fileList).toContain(`${constants.HAPI_PATH}/data/config/bootstrap.properties`)
      fs.rmdirSync(tmpDir, { recursive: true })
    })
  })
})
