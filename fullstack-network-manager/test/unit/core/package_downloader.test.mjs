import { describe, expect, it } from '@jest/globals'
import * as core from '../../../src/core/index.mjs'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { IllegalArgumentError, ResourceNotFoundError } from '../../../src/core/errors.mjs'

describe('PackageDownloader', () => {
  const testLogger = core.logging.NewLogger('debug')
  const downloader = new core.PackageDownloader(testLogger)

  describe('urlExists', () => {
    it('should return true if source URL is valid', async () => {
      expect.assertions(1)
      const url = 'https://builds.hedera.com/node/software/v0.42/build-v0.42.5.sha384'
      await expect(downloader.urlExists(url)).resolves.toBe(true)
    })
    it('should return false if source URL is valid', async () => {
      expect.assertions(1)
      const url = 'https://builds.hedera.com/node/software/v0.42/build-v0.42.5.INVALID'
      await expect(downloader.urlExists(url)).resolves.toBe(false)
    })
  })

  describe('fetchFile', () => {
    it('should fail if source URL is missing', async () => {
      expect.assertions(1)

      try {
        await downloader.fetchFile('', os.tmpdir())
      } catch (e) {
        expect(e.message).toBe('source file URL is required')
      }
    })

    it('should fail if destination path is missing', async () => {
      expect.assertions(1)

      try {
        await downloader.fetchFile('https://localhost', '')
      } catch (e) {
        expect(e.message).toBe('destination path is required')
      }
    })

    it('should fail with a malformed URL', async () => {
      expect.assertions(2)

      try {
        await downloader.fetchFile('INVALID_URL', os.tmpdir())
      } catch (e) {
        expect(e).toBeInstanceOf(IllegalArgumentError)
        expect(e.message).toBe('source URL is invalid')
      }
    })

    it('should fail with an invalid URL', async () => {
      expect.assertions(2)

      try {
        await downloader.fetchFile('https://localhost/INVALID_FILE', os.tmpdir())
      } catch (e) {
        expect(e).toBeInstanceOf(ResourceNotFoundError)
        expect(e.message).toBe('source URL does not exist')
      }
    })

    it('should succeed with a valid release artifact URL', async () => {
      try {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'downloader-'))

        const tag = 'v0.42.5'
        const destPath = `${tmpDir}/build-${tag}.sha384`

        // we use the build-<tag>.sha384 file URL to test downloading a small file
        const url = `https://builds.hedera.com/node/software/v0.42/build-${tag}.sha384`
        await expect(downloader.fetchFile(url, destPath)).resolves.toBe(destPath)
        expect(fs.existsSync(destPath)).toBeTruthy()

        // remove the file to reduce disk usage
        fs.rmSync(destPath)
        fs.rmdirSync(tmpDir)
      } catch (e) {
        expect(e).toBeNull()
      }
    })
  })

  describe('fetchPlatform', () => {
    it('should fail if platform release tag is missing', async () => {
      expect.assertions(2)

      const tag = 'v0.40.0-INVALID'

      try {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'downloader-'))
        await downloader.fetchPlatform(tag, tmpDir)
        fs.rmdirSync(tmpDir, { recursive: true })
      } catch (e) {
        expect(e.cause).not.toBeNull()
        expect(e.cause).toBeInstanceOf(ResourceNotFoundError)
      }
    })

    it('should fail if platform release tag is invalid', async () => {
      expect.assertions(1)

      try {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'downloader-'))
        await downloader.fetchPlatform('INVALID', os.tmpdir())
        fs.rmdirSync(tmpDir, { recursive: true })
      } catch (e) {
        expect(e.message).toContain('must include major, minor and patch fields')
      }
    })

    it('should fail if destination directory is null', async () => {
      expect.assertions(1)
      try {
        await downloader.fetchPlatform('v0.40.0', '')
      } catch (e) {
        expect(e.message).toContain('destination directory path is required')
      }
    })
  })
})
