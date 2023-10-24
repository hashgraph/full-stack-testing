import {BaseCommand} from "./base.mjs";
import * as core from "../core/index.mjs"

/**
 * Defines the core functionalities of 'init' command
 */
export const InitCommand = class extends BaseCommand {
    /**
     * Executes the init CLI command
     * @returns {Promise<boolean>}
     */
    async init() {
        let deps = [
            core.constants.HELM,
            core.constants.KIND,
            core.constants.KUBECTL,
        ]

        let status = await this.checkDependencies(deps)
        if (!status) {
            this.showUser("FAIL: Required dependencies are not found: %s", deps)
            return false
        }

        this.showUser("PASS: All required dependencies are found: %s", deps)

        return status
    }

    /**
     * Return Yargs command definition for 'init' command
     * @param initCmd an instance of InitCommand
     */
    static getCommandDefinition(initCmd){
        return {
            command: "init",
            desc: "Perform dependency checks and initialize local environment",
            builder: {},
            handler: (argv) => {
                initCmd.init(argv)
            }
        }
    }
}


