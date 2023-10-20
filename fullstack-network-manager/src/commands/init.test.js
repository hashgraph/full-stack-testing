import {InitCommand} from "./init.mjs";
import {test, expect, describe, it} from "@jest/globals";
import * as core  from "../core/index.mjs";
import {BaseCommand} from "./base.mjs";

const testLogger = core.logging.NewLogger('debug')
describe('InitCommand', () => {
    const initCmd = new InitCommand({logger: testLogger})

    describe('commands', () => {
        it('init execution should succeed', async () => {
            await expect(initCmd.init()).resolves.toBe(true)
        })
    })

    describe('static', () => {
        it('command definition should return a valid command def', async () => {
            const def = InitCommand.getCommandDefinition(initCmd)
            expect(def.name).not.toBeNull()
            expect(def.desc).not.toBeNull()
            expect(def.handler).not.toBeNull()
        })
    })
})

