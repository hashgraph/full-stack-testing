import {InitCommand} from "../../src/commands/init.mjs";
import {expect, describe, it} from "@jest/globals";
import * as core  from "../../src/core/index.mjs";
import {Helm, Kind, Kubectl} from "../../src/core/index.mjs";
import {BaseCommand} from "../../src/commands/base.mjs";

const testLogger = core.logging.NewLogger('debug')
describe('InitCommand', () => {
    const kind = new Kind({logger: testLogger})
    const helm = new Helm({logger: testLogger})
    const kubectl = new Kubectl({logger: testLogger})
    const initCmd = new InitCommand({
        logger: testLogger,
        kind: kind,
        helm: helm,
        kubectl: kubectl,
    })

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

