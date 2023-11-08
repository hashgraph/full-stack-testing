import {describe, expect, it} from "@jest/globals";
import * as core from "../../../src/core/index.mjs";
import {PackageDownloader} from "../../../src/core/package_downloader.mjs";
import * as fs from 'fs'
import * as path from "path";
import * as os from "os";
import {Templates} from "../../../src/core/index.mjs";

describe('PackageDownloaderE2E', () => {
    const testLogger = core.logging.NewLogger('debug')
    const downloader = new PackageDownloader(testLogger)

        it('should succeed with a valid Hedera release tag', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'downloader-'));

            const tag = 'v0.42.5'
            const releasePrefix = Templates.prepareReleasePrefix(tag)

            const destPath = `${tmpDir}/${releasePrefix}/build-${tag}.zip`
            await expect(downloader.fetchPlatform(tag, tmpDir)).resolves.toBe(destPath)
            expect(fs.existsSync(destPath)).toBeTruthy()
            testLogger.showUser(destPath)

            // remove the downloaded files to reduce disk usage
            fs.rmSync(`${tmpDir}/v0.42/build-${tag}.zip`)
            fs.rmSync(`${tmpDir}/v0.42/build-${tag}.sha384`)
            fs.rmdirSync(`${tmpDir}/v0.42`)
            fs.rmdirSync(tmpDir)
        }, 100000)
})
