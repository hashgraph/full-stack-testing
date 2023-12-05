import { describe, expect, it } from '@jest/globals'
import { NodeCommand } from '../../../src/commands/node.mjs'
import {
  ChartManager,
  ConfigManager,
  Helm,
  Kind,
  Kubectl,
  PackageDownloader,
  PlatformInstaller,
  constants
} from '../../../src/core/index.mjs'
import { TEST_CACHE_DIR, testLogger } from '../../test_util.js'

describe('NodeCommand', () => {
  const kind = new Kind(testLogger)
  const helm = new Helm(testLogger)
  const kubectl = new Kubectl(testLogger)
  const chartManager = new ChartManager(helm, testLogger)
  const configManager = new ConfigManager(testLogger)
  const packageDownloader = new PackageDownloader(testLogger)
  const platformInstaller = new PlatformInstaller(testLogger, kubectl)

  const nodeCmd = new NodeCommand({
    logger: testLogger,
    kind,
    helm,
    kubectl,
    chartManager,
    configManager,
    downloader: packageDownloader,
    platformInstaller
  })

  const argv = {
    releaseTag: 'v0.42.5',
    namespace: constants.NAMESPACE_NAME,
    nodeIds: 'node0',
    cacheDir: TEST_CACHE_DIR,
    force: false,
    chainId: constants.HEDERA_CHAIN_ID
  }

  describe('start', () => {
    it('setup should succeed with valid parameters', async () => {
      expect.assertions(1)
      try {
        await expect(nodeCmd.setup(argv)).resolves.toBeTruthy()
      } catch (e) {
        console.error(e)
        expect(e).toBeNull()
      }
    }, 10000)
  })

  it('start should succeed with valid parameters', async () => {
    expect.assertions(1)
    try {
      await expect(nodeCmd.start(argv)).resolves.toBeTruthy()
    } catch (e) {
      console.error(e)
      expect(e).toBeNull()
    }
  }, 10000)
})
