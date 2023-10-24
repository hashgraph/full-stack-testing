"use strict"
import {exec} from "child_process";
import * as core from "../core/index.mjs"
import * as util from "util";

export const BaseCommand = class BaseCommand {
    /**
     * Check if 'kind' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
    async checkKind() {
        try {
            this.logger.debug("Checking if 'kind' is installed")
            await this.runExec("kind --version")
            this.logger.debug("OK: 'kind' is installed")
        } catch (e) {
            this.logger.error("%s", e)
            return false
        }

        return true
    }

    /**
     * Check if 'helm' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
    async checkHelm() {
        try {
            this.logger.debug("Checking if 'helm' is installed")
            await this.runExec("helm version")
            this.logger.debug("OK: 'helm' is installed")
        } catch (e) {
            this.logger.error("%s", e)
            return false
        }

        return true
    }

    /**
     * Check if 'kubectl' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
    async checkKubectl() {
        try {
            this.logger.debug("Checking if 'kubectl' is installed")
            await this.runExec("kubectl version")
            this.logger.debug("OK: 'kubectl' is installed")
        } catch (e) {
            this.logger.error("%s", e)
            return false
        }

        return true
    }

    /**
     * Check if all the required dependencies are installed or not
     * @param deps is a list of dependencies
     * @returns {Promise<boolean>}
     */
    async checkDependencies(deps = []) {
        this.logger.info("Checking for required dependencies: %s", deps)

        for (let i = 0; i < deps.length; i++) {
            let dep = deps[i]
            this.logger.debug("Checking for dependency '%s'", dep)

            let check = this.checks.get(dep)
            if (!check) {
                this.logger.error("FAIL: Dependency '%s' is unknown", dep)
                return false
            }


            let status = await check()
            if (!status) {
                this.logger.error("FAIL: Dependency '%s' is not found", dep)
                return false
            }

            this.logger.debug("PASS: Dependency '%s' is found", dep)
        }

        this.logger.info("PASS: All required dependencies are found: %s", deps)
        return true
    }

    /**
     * Run the specified bash command
     * @param cmd is a bash command including args
     * @returns {Promise<unknown>}
     */
    runExec(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stderr, stdout) => {
                if (error) {
                    reject(error)
                }

                console.log(stderr)
                console.log(stdout)

                resolve(stdout)
            })
        })
    }

    showUser(msg, ...args) {
        console.log(util.format(msg, ...args))
        this.logger.debug(msg, ...args)
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
