import {BaseCommand} from "./base.mjs";
import * as core from "../core/index.mjs"
import chalk from "chalk";

/**
 * Defines the core functionalities of 'init' command
 */
export class InitCommand extends BaseCommand {
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
            return false
        }

        this.logger.showUser(chalk.green("OK: All required dependencies are found: %s"), chalk.yellow(deps))

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
                initCmd.init(argv).then(r => {
                    if (!r) process.exit(1)
                })
            }
        }
    }
}


