import {BaseCommand} from "./base.mjs";
import * as core from "../core/index.mjs"
import chalk from "chalk";
import {constants} from "../core/index.mjs";
import * as fs from 'fs'
import {FullstackTestingError} from "../core/errors.mjs";

/**
 * Defines the core functionalities of 'init' command
 */
export class InitCommand extends BaseCommand {
    /**
     * Setup home directories
     * @param dirs a list of directories that need to be created in sequence
     * @returns {Promise<void>}
     */
    async setupHomeDirectory(dirs = [
        constants.FST_HOME_DIR,
        constants.FST_LOGS_DIR,
        constants.FST_CACHE_DIR,
    ]) {
        const self = this

        try {
            dirs.forEach(dirPath => {
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath)
                }
                self.logger.showUser(chalk.green(`OK: setup directory: ${dirPath}`))
            })
        } catch (e) {
            this.logger.error(e)
            throw new FullstackTestingError(e.message, e)
        }
    }

    /**
     * Executes the init CLI command
     * @returns {Promise<boolean>}
     */
    async init() {
        try {
            await this.setupHomeDirectory()

            const deps = [
                core.constants.HELM,
                core.constants.KIND,
                core.constants.KUBECTL,
            ]

            const status = await this.checkDependencies(deps)
            if (!status) {
                return false
            }

            this.logger.showUser(chalk.green("OK: All required dependencies are found: %s"), chalk.yellow(deps))



            return status
        } catch (e) {
            this.logger.showUserError(e)
            return false
        }
    }

    /**
     * Return Yargs command definition for 'init' command
     * @param initCmd an instance of InitCommand
     */
    static getCommandDefinition(initCmd) {
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


