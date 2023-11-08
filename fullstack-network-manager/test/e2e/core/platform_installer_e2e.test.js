import {beforeAll, describe, expect, it, test} from "@jest/globals";
import * as core from "../../../src/core/index.mjs";
import {PackageDownloader, PlatformInstaller} from "../../../src/core/index.mjs";
import * as fs from 'fs'
import * as path from "path";
import * as os from "os";
import {
    FullstackTestingError,
    IllegalArgumentError,
    MissingArgumentError,
    ResourceNotFoundError
} from "../../../src/core/errors.mjs";
describe('PackageInstallerE2E', () => {
    const testLogger = core.logging.NewLogger('debug')
    const kubectl = new core.Kubectl(testLogger)
    const installer = new PlatformInstaller(testLogger, kubectl)
    const downloader = new PackageDownloader(testLogger)
    const podName = 'network-node0-0'
    const packageTag = 'v0.42.5'
    let packageFile = ''
    let releaseDir = ''

    beforeAll(async () => {
        try {
            fs.mkdirSync('tests/data/tmp', {recursive: true})
            packageFile = await downloader.fetchPlatform(packageTag, 'test/data/tmp')
        } catch (e) {
            console.error(e)
            expect(e).toBeNull()
        }
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

    describe('extractPlatform', () => {
        it('should succeed with valid tag and pod', async () => {
            expect.assertions(1)
            try {
                await expect(installer.copyPlatform(podName, packageFile, true)).resolves.toBeTruthy()
                const outputs =  await kubectl.execContainer(podName, core.constants.ROOT_CONTAINER, `ls -la ${core.constants.HAPI_PATH}`)
                testLogger.showUser(outputs)
            } catch (e) {
                console.error(e)
                expect(e).toBeNull()
            }
        })
    })
})
