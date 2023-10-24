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
        this.logger.info("-------------- Start running `init` --------------")

        let status = await this.checkDependencies([
            core.constants.HELM,
            core.constants.KIND,
            core.constants.KUBECTL,
        ])

        this.logger.info("-------------- Finished running `init` --------------")

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


