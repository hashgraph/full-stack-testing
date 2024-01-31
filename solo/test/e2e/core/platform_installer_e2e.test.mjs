import { beforeAll, describe, expect, it } from '@jest/globals'
import {
  PackageDownloader,
  PlatformInstaller,
  constants,
  Templates,
  ConfigManager, Templates as Template
} from '../../../src/core/index.mjs'
import * as fs from 'fs'
import * as path from 'path'
import { K8 } from '../../../src/core/k8.mjs'
import { ShellRunner } from '../../../src/core/shell_runner.mjs'

import { getTestCacheDir, getTmpDir, testLogger } from '../../test_util.js'

describe('PackageInstallerE2E', () => {
  const configManager = new ConfigManager(testLogger)
  const k8 = new K8(configManager, testLogger)
  const installer = new PlatformInstaller(testLogger, k8)
  const downloader = new PackageDownloader(testLogger)
  const testCacheDir = getTestCacheDir()
  const podName = 'network-node0-0'
  const packageVersion = 'v0.47.0-alpha.0'
  let packageFile = ''

  beforeAll(async () => {
    if (!fs.existsSync(testCacheDir)) {
      fs.mkdirSync(testCacheDir)
    }

    configManager.load()
  })

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
    it('should succeed fetching platform release', async () => {
      const releasePrefix = Templates.prepareReleasePrefix(packageVersion)
      const destPath = `${testCacheDir}/${releasePrefix}/build-${packageVersion}.zip`
      await expect(downloader.fetchPlatform(packageVersion, testCacheDir)).resolves.toBe(destPath)
      expect(fs.existsSync(destPath)).toBeTruthy()
      testLogger.showUser(destPath)

      // do not delete the cache dir
    }, 200000)

    it('should succeed with valid tag and pod', async () => {
      expect.assertions(1)
      try {
        packageFile = await downloader.fetchPlatform(packageVersion, testCacheDir)
        await expect(installer.copyPlatform(podName, packageFile, true)).resolves.toBeTruthy()
        const outputs = await k8.execContainer(podName, constants.ROOT_CONTAINER, `ls -la ${constants.HEDERA_HAPI_PATH}`)
        testLogger.showUser(outputs)
      } catch (e) {
        console.error(e)
        expect(e).toBeNull()
      }
    }, 20000)
  })

  describe('prepareConfigTxt', () => {
    it('should succeed in generating config.txt', async () => {
      const tmpDir = getTmpDir()
      const configPath = `${tmpDir}/config.txt`
      const nodeIDs = ['node0', 'node1', 'node2']
      const chainId = '299'

      const configLines = await installer.prepareConfigTxt(nodeIDs, configPath, packageVersion, chainId)

      // verify format is correct
      expect(configLines.length).toBe(6)
      expect(configLines[0]).toBe(`swirld, ${chainId}`)
      expect(configLines[1]).toBe(`app, ${constants.HEDERA_APP_NAME}`)
      expect(configLines[2]).toContain('address, 0, node0, node0, 1')
      expect(configLines[3]).toContain('address, 1, node1, node1, 1')
      expect(configLines[4]).toContain('address, 2, node2, node2, 1')
      expect(configLines[5]).toBe('nextNodeId, 3')

      // verify the file exists
      expect(fs.existsSync(configPath)).toBeTruthy()
      const fileContents = fs.readFileSync(configPath).toString()

      // verify file content matches
      expect(fileContents).toBe(configLines.join('\n'))

      fs.rmSync(tmpDir, { recursive: true })
    })
  })

  describe('copyGossipKeys', () => {
    it('should succeed to copy legacy pfx gossip keys for node0', async () => {
      const podName = 'network-node0-0'
      const nodeId = 'node0'

      // generate pfx keys
      const tmpDir = getTmpDir()
      const keysDir = path.join(tmpDir, 'keys')
      const shellRunner = new ShellRunner(testLogger)
      await shellRunner.run(`test/scripts/legacy-key-generate.sh ${keysDir} node0`)

      await installer.setupHapiDirectories(podName)
      const fileList = await installer.copyGossipKeys(podName, tmpDir, constants.KEY_FORMAT_PFX)

      const destDir = `${constants.HEDERA_HAPI_PATH}/data/keys`
      expect(fileList.length).toBe(2)
      expect(fileList).toContain(`${destDir}/${Templates.renderGossipPfxPrivateKeyFile(nodeId)}`)
      expect(fileList).toContain(`${destDir}/public.pfx`)

      fs.rmSync(tmpDir, { recursive: true })
    }, 20000)

    it('should succeed to copy pem gossip keys for node1', async () => {
      const podName = 'network-node1-0'
      const nodeId = 'node1'

      // generate pfx keys
      const tmpDir = getTmpDir()
      const keysDir = path.join(tmpDir, 'keys')
      const shellRunner = new ShellRunner(testLogger)
      await shellRunner.run(`test/scripts/standard-key-generate.sh ${keysDir} node1`)

      await installer.setupHapiDirectories(podName)
      const fileList = await installer.copyGossipKeys(podName, tmpDir, constants.KEY_FORMAT_PEM)

      const destDir = `${constants.HEDERA_HAPI_PATH}/data/keys`
      expect(fileList.length).toBe(4)
      expect(fileList).toContain(`${destDir}/${Templates.renderGossipPemPrivateKeyFile(constants.SIGNING_KEY_PREFIX, nodeId)}`)
      expect(fileList).toContain(`${destDir}/${Templates.renderGossipPemPublicKeyFile(constants.SIGNING_KEY_PREFIX, nodeId)}`)
      expect(fileList).toContain(`${destDir}/${Templates.renderGossipPemPrivateKeyFile(constants.AGREEMENT_KEY_PREFIX, nodeId)}`)
      expect(fileList).toContain(`${destDir}/${Templates.renderGossipPemPublicKeyFile(constants.AGREEMENT_KEY_PREFIX, nodeId)}`)

      fs.rmSync(tmpDir, { recursive: true })
    })
  })

  describe('copyTLSKeys', () => {
    it('should succeed to copy TLS keys for node0', async () => {
      const nodeId = 'node1'
      const podName = Template.renderNetworkPodName(nodeId)
      const tmpDir = getTmpDir()
      const keysDir = path.join(tmpDir, 'keys')

      // create mock files
      fs.mkdirSync(keysDir)
      fs.writeFileSync(path.join(keysDir, `hedera-${nodeId}.pem`), '')
      fs.writeFileSync(path.join(keysDir, `hedera-${nodeId}.pem`), '')

      await installer.setupHapiDirectories(podName)

      const fileList = await installer.copyTLSKeys(podName, tmpDir)

      expect(fileList.length).toBe(2) // [data , hedera.crt, hedera.key]
      expect(fileList.length).toBeGreaterThanOrEqual(2)
      expect(fileList).toContain(`${constants.HEDERA_HAPI_PATH}/hedera.crt`)
      expect(fileList).toContain(`${constants.HEDERA_HAPI_PATH}/hedera.key`)

      fs.rmSync(tmpDir, { recursive: true })
    })
  })

  describe('copyPlatformConfigFiles', () => {
    it('should succeed to copy platform config files for node0', async () => {
      const podName = 'network-node0-0'
      await installer.setupHapiDirectories(podName)

      const tmpDir = getTmpDir()
      const nodeIDs = ['node0']
      const releaseTag = 'v0.42.0'

      fs.cpSync(`${constants.RESOURCES_DIR}/templates`, `${tmpDir}/templates`, { recursive: true })
      await installer.prepareConfigTxt(nodeIDs, `${tmpDir}/config.txt`, releaseTag, constants.HEDERA_CHAIN_ID, `${tmpDir}/templates/config.template`)

      const fileList = await installer.copyPlatformConfigFiles(podName, tmpDir)
      expect(fileList.length).toBeGreaterThanOrEqual(6)
      expect(fileList).toContain(`${constants.HEDERA_HAPI_PATH}/config.txt`)
      expect(fileList).toContain(`${constants.HEDERA_HAPI_PATH}/log4j2.xml`)
      expect(fileList).toContain(`${constants.HEDERA_HAPI_PATH}/settings.txt`)
      expect(fileList).toContain(`${constants.HEDERA_HAPI_PATH}/data/config/api-permission.properties`)
      expect(fileList).toContain(`${constants.HEDERA_HAPI_PATH}/data/config/application.properties`)
      expect(fileList).toContain(`${constants.HEDERA_HAPI_PATH}/data/config/bootstrap.properties`)
      fs.rmSync(tmpDir, { recursive: true })
    }, 10000)
  })
})