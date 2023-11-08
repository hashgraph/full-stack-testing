import {describe, expect, it, test} from "@jest/globals";
import * as core from "../../../src/core/index.mjs";
import {PlatformInstaller} from "../../../src/core/index.mjs";
import * as fs from 'fs'
import * as path from "path";
import * as os from "os";
import {
    IllegalArgumentError,
    MissingArgumentError,
} from "../../../src/core/errors.mjs";
describe('PackageInstaller', () => {
    const testLogger = core.logging.NewLogger('debug')
    const kubectl = new core.Kubectl(testLogger)
    const installer = new PlatformInstaller(testLogger, kubectl)

    describe('validatePlatformReleaseDir', () => {
        it('should fail for missing path', async () => {
            expect.assertions(1)
            await expect(installer.validatePlatformReleaseDir('')).rejects.toThrow(MissingArgumentError)
        })

        it('should fail for invalid path', async () => {
            expect.assertions(1)
            await expect(installer.validatePlatformReleaseDir('/INVALID')).rejects.toThrow(IllegalArgumentError)
        })

        it('should fail if directory does not have data/apps directory', async () => {
            expect.assertions(1)

            let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-'));
            fs.mkdirSync(`${tmpDir}/${core.constants.DATA_LIB_DIR}`, {recursive: true})
            await expect(installer.validatePlatformReleaseDir(tmpDir)).rejects.toThrow(IllegalArgumentError)
            fs.rmdirSync(tmpDir, {recursive: true})
        })

        it('should fail if directory does not have data/libs directory', async () => {
            expect.assertions(1)

            let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-'));
            fs.mkdirSync(`${tmpDir}/${core.constants.DATA_APPS_DIR}`, {recursive: true})
            await expect(installer.validatePlatformReleaseDir(tmpDir)).rejects.toThrow(IllegalArgumentError)
            fs.rmdirSync(tmpDir, {recursive: true})
        })

        it('should fail if directory does not have data/app directory is empty', async () => {
            expect.assertions(1)

            let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-'));
            fs.mkdirSync(`${tmpDir}/${core.constants.DATA_APPS_DIR}`, {recursive: true})
            fs.mkdirSync(`${tmpDir}/${core.constants.DATA_LIB_DIR}`, {recursive: true})
            fs.writeFileSync(`${tmpDir}/${core.constants.DATA_LIB_DIR}/test.jar`, '')
            await expect(installer.validatePlatformReleaseDir()).rejects.toThrow(MissingArgumentError)
            fs.rmdirSync(tmpDir, {recursive: true})
        })

        it('should fail if directory does not have data/libs directory is empty', async () => {
            expect.assertions(1)

            let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-'));
            fs.mkdirSync(`${tmpDir}/${core.constants.DATA_APPS_DIR}`, {recursive: true})
            fs.writeFileSync(`${tmpDir}/${core.constants.DATA_APPS_DIR}/app.jar`, '')
            fs.mkdirSync(`${tmpDir}/${core.constants.DATA_LIB_DIR}`, {recursive: true})
            await expect(installer.validatePlatformReleaseDir()).rejects.toThrow(MissingArgumentError)
            fs.rmdirSync(tmpDir, {recursive: true})
        })

        it('should succeed with non-empty data/apps and data/libs directory', async () => {
            expect.assertions(1)

            let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-'));
            fs.mkdirSync(`${tmpDir}/${core.constants.DATA_APPS_DIR}`, {recursive: true})
            fs.writeFileSync(`${tmpDir}/${core.constants.DATA_APPS_DIR}/app.jar`, '')
            fs.mkdirSync(`${tmpDir}/${core.constants.DATA_LIB_DIR}`, {recursive: true})
            fs.writeFileSync(`${tmpDir}/${core.constants.DATA_LIB_DIR}/lib-1.jar`, '')
            await expect(installer.validatePlatformReleaseDir()).rejects.toThrow(MissingArgumentError)
            fs.rmdirSync(tmpDir, {recursive: true})
        })
    })

    describe('extractPlatform', () => {
        it('should fail for missing pod name', async () => {
            expect.assertions(1)
            await expect(installer.copyPlatform('', os.tmpdir())).rejects.toThrow(MissingArgumentError)
        })
        it('should fail for missing releaseDir', async () => {
            expect.assertions(1)
            await expect(installer.copyPlatform('network-node0-0', '' )).rejects.toThrow(MissingArgumentError)
        })
    })
})
