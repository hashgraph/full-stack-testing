import { describe, expect, it } from '@jest/globals'
import * as fs from 'fs'
import { logging, PackageDownloader, Templates } from '../../../src/core/index.mjs'

describe('PackageDownloaderE2E', () => {
  const testLogger = logging.NewLogger('debug')
  const downloader = new PackageDownloader(testLogger)

  it('should succeed with a valid Hedera release tag', async () => {
    const testCacheDir = 'test/data/tmp'

    const tag = 'v0.42.5'
    const releasePrefix = Templates.prepareReleasePrefix(tag)

    const destPath = `${testCacheDir}/${releasePrefix}/build-${tag}.zip`
    await expect(downloader.fetchPlatform(tag, testCacheDir)).resolves.toBe(destPath)
    expect(fs.existsSync(destPath)).toBeTruthy()
    testLogger.showUser(destPath)
  }, 200000)
})
