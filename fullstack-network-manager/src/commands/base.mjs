"use strict"
import {exec} from "child_process";
import * as core from "../core/index.mjs"
import chalk from "chalk";

export const BaseCommand = class BaseCommand {
    async checkDep(dep) {
        try {
            await this.runExec(dep)
        } catch (e) {
            this.logger.error("%s", e)
            return false
        }

        return true
    }
    /**
     * Check if 'kind' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
    async checkKind() {
        return this.checkDep(core.constants.KIND)
    }

    /**
     * Check if 'helm' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
    async checkHelm() {
        return this.checkDep(core.constants.HELM)
    }

    /**
     * Check if 'kubectl' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
    async checkKubectl() {
        return this.checkDep(core.constants.KUBECTL)
    }

    /**
     * Check if all the required dependencies are installed or not
     * @param deps is a list of dependencies
     * @returns {Promise<boolean>}
     */
    async checkDependencies(deps = []) {
        this.logger.debug("Checking for required dependencies: %s", deps)

        for (let i = 0; i < deps.length; i++) {
            let dep = deps[i]
            this.logger.debug("Checking for dependency '%s'", dep)

            let status = false
            let check = this.checks.get(dep)
            if (check) {
                status = await check()
            }

            if (!status) {
                this.logger.showUser(chalk.red(`FAIL: '${dep}' is not found`))
                return false
            }

            this.logger.showUser(chalk.green(`OK: '${dep}' is found`))
        }

        this.logger.debug("All required dependencies are found: %s", deps)

        return true
    }

    /**
     * Run the specified bash command
     * @param cmd is a bash command including args
     * @returns {Promise<string>}
     */
    runExec(cmd) {
        let self = this

        return new Promise((resolve, reject) => {
            self.logger.debug(`Invoking '${cmd}'...`)
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(error)
                }

                resolve(stdout)
            })
        })
    }

    constructor(opts) {
        if (opts.logger === undefined) throw new Error("logger cannot be null")

        this.logger = opts.logger

        // map of dependency checks
        this.checks = new Map()
            .set(core.constants.KIND, () => this.checkKind())
            .set(core.constants.HELM, () => this.checkHelm())
            .set(core.constants.KUBECTL, () => this.checkKubectl())
    }
}
