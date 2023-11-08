import {describe, expect, it, test} from "@jest/globals";
import * as core from "../../../src/core/index.mjs";
import {FullstackTestingError, IllegalArgumentError, MissingArgumentError} from "../../../src/core/errors.mjs";
import os from "os";
import fs from "fs";
import path from "path";
import {Zippy} from "../../../src/core/zippy.mjs";
describe('Zippy', () => {
    const testLogger = core.logging.NewLogger('debug')
    const zippy = new Zippy(testLogger)

    describe('unzip', () => {
        it('should fail if source file is missing', async () => {
            expect.assertions(1)
            await expect(zippy.unzip('', '')).rejects.toThrow(MissingArgumentError)
        })

        it('should fail if destination file is missing', async () => {
            expect.assertions(1)
            await expect(zippy.unzip('', '')).rejects.toThrow(MissingArgumentError)
        })

        it('should fail if source file is invalid', async () => {
            expect.assertions(1)
            await expect(zippy.unzip('/INVALID', os.tmpdir())).rejects.toThrow(IllegalArgumentError)
        })

        it('should fail for a directory', async () => {
            expect.assertions(1)
            await expect(zippy.unzip('test/data', os.tmpdir())).rejects.toThrow(FullstackTestingError)
        })

        it('should fail for a non-zip file', async () => {
            expect.assertions(1)
            await expect(zippy.unzip('test/data/test.txt', os.tmpdir())).rejects.toThrow(FullstackTestingError)
        })

        it('should succeed for valid inputs', async () => {
            expect.assertions(1)
            let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-'));
            await expect(zippy.unzip('test/data/test.zip', tmpDir, true)).resolves.toBe(tmpDir)
            fs.rmSync(tmpDir, {recursive: true, force: true}); // not very safe!
        })
    })
})
