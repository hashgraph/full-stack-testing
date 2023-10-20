import {test, expect, it, describe} from "@jest/globals";
import {logging} from "../core/index.mjs";
import {BaseCommand} from "./base.mjs";
import * as core from "../core/index.mjs"

const testLogger = logging.NewLogger("debug")

describe('BaseCommand', () => {
    const baseCmd = new BaseCommand({logger: testLogger})

    describe('runExec', () => {
        it('should fail during invalid program check', async() => {
            await expect(baseCmd.runExec("INVALID_PROGRAM")).rejects.toThrowError()
        })
        it('should succeed during valid program check', async() => {
            await expect(baseCmd.runExec("date")).resolves.not.toBeNull()
        })
    })

    describe('checks', () => {
        it('should succeed with checkKind', async() => {
            await expect(baseCmd.checkKind()).resolves.toBe(true)
        })

        it('should succeed with checkHelm', async() => {
            await expect(baseCmd.checkHelm()).resolves.toBe(true)
        })

        it('should succeed with checkKubectl', async() => {
            await expect(baseCmd.checkKubectl()).resolves.toBe(true)
        })
    })

    describe('checkDependencies', () => {
        it('should fail during invalid dependency check', async() => {
            await expect(baseCmd.checkDependencies([core.constants.KIND, "INVALID"])).resolves.toBe(false)
        })
        it('should succeed during valid dependencies check', async() => {
            await expect(baseCmd.checkDependencies([core.constants.KIND, core.constants.HELM])).resolves.toBe(true)
        })
    })
})
