import {describe, expect, it, test} from "@jest/globals";
import * as core from "../../../src/core/index.mjs";
import {PlatformInstaller} from "../../../src/core/index.mjs";
import * as fs from 'fs'
import * as path from "path";
import * as os from "os";
import {
    FullstackTestingError,
    IllegalArgumentError,
    MissingArgumentError,
    ResourceNotFoundError
} from "../../../src/core/errors.mjs";
describe('PackageInstaller', () => {
    const testLogger = core.logging.NewLogger('debug')
    const kubectl = new core.Kubectl(testLogger)
    const installer = new PlatformInstaller(testLogger, kubectl)

    describe('unzipFile', () => {
        it('should fail if source file is missing', async () => {
            expect.assertions(1)
            await expect(installer.unzipFile('', '')).rejects.toThrow(MissingArgumentError)
        })

        it('should fail if destination file is missing', async () => {
            expect.assertions(1)
            await expect(installer.unzipFile('', '')).rejects.toThrow(MissingArgumentError)
        })

        it('should fail if source file is invalid', async () => {
            expect.assertions(1)
            await expect(installer.unzipFile('/INVALID', os.tmpdir())).rejects.toThrow(IllegalArgumentError)
        })

        it('should fail for a directory', async () => {
            expect.assertions(1)
            await expect(installer.unzipFile('test/data', os.tmpdir())).rejects.toThrow(FullstackTestingError)
        })

        it('should fail for a non-zip file', async () => {
            expect.assertions(1)
            await expect(installer.unzipFile('test/data/test.txt', os.tmpdir() )).rejects.toThrow(FullstackTestingError)
        })

        it('should succeed for valid inputs', async () => {
            expect.assertions(1)
            let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-'));
            await expect(installer.unzipFile('test/data/test.zip', tmpDir, true)).resolves.toBe(tmpDir)
            fs.rmSync(tmpDir, { recursive: true, force: true }); // not very safe!
        })

    })
})
