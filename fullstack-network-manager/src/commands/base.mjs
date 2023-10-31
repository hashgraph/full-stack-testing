"use strict"
import {exec} from "child_process";
import * as core from "../core/index.mjs"
import chalk from "chalk";
import {ShellRunner} from "../core/shell_runner.mjs";

export const BaseCommand = class BaseCommand extends ShellRunner {
    async checkDep(cmd) {
        try {
            this.logger.debug(cmd)
            await this.run(cmd)
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
        return this.checkDep(`${core.constants.KIND} --version`)
    }

    /**
     * Check if 'helm' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
    async checkHelm() {
        return this.checkDep(`${core.constants.HELM} version`)
    }

    /**
     * Check if 'kubectl' CLI program is installed or not
     * @returns {Promise<boolean>}
     */
    async checkKubectl() {
        return this.checkDep(`${core.constants.KUBECTL} version`)
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
     * List available clusters
     * @returns {Promise<string[]>}
     */
    async getInstalledCharts(namespaceName) {
        try {
            let cmd = `helm list -n ${namespaceName} -q`

            let output = await this.run(cmd)
            this.logger.showUser("\nList of installed charts\n--------------------------\n%s", output)

            return output.split(/\r?\n/)
        } catch (e) {
            this.logger.error("%s", e)
            this.logger.showUser(e.message)
        }

        return []
    }

    async chartInstall(namespaceName, releaseName, chartPath, valuesArg) {
        try {
            this.logger.showUser(chalk.cyan(`Setting up FST network...`))

            let charts= await this.getInstalledCharts(namespaceName)
            if (!charts.includes(releaseName)) {
                let cmd = `helm install -n ${namespaceName} ${releaseName} ${chartPath} ${valuesArg}`
                this.logger.showUser(chalk.cyan(`Installing ${releaseName} chart`))

                let output = await this.run(cmd)
                this.logger.showUser(chalk.green('OK'), `chart '${releaseName}' is installed`)
            } else {
                this.logger.showUser(chalk.green('OK'), `chart '${releaseName}' is already installed`)
            }

            this.logger.showUser(chalk.yellow("Chart setup is complete"))

            return true
        } catch (e) {
            this.logger.error("%s", e.stack)
            this.logger.showUser(e.message)
        }

        return false
    }

    async chartUninstall(namespaceName, releaseName) {
        try {
            this.logger.showUser(chalk.cyan(`Uninstalling FST network ...`))

            let charts= await this.getInstalledCharts(namespaceName)
            if (charts.includes(releaseName)) {
                let cmd = `helm uninstall ${releaseName} -n ${namespaceName}`
                this.logger.showUser(chalk.cyan(`Uninstalling ${releaseName} chart`))

                let output = await this.run(cmd)
                this.logger.showUser(chalk.green('OK'), `chart '${releaseName}' is uninstalled`)
                await this.getInstalledCharts(namespaceName)
            } else {
                this.logger.showUser(chalk.green('OK'), `chart '${releaseName}' is already uninstalled`)
            }

            this.logger.showUser(chalk.yellow("Chart uninstallation is complete"))

            return true
        } catch (e) {
            this.logger.error("%s", e.stack)
            this.logger.showUser(e.message)
        }

        return false
    }

    async chartUpgrade(namespaceName, releaseName, chartPath, valuesArg) {
        try {
            this.logger.showUser(chalk.cyan(`Upgrading FST network deployment chart ...`))

            let charts= await this.getInstalledCharts(namespaceName)
            if (charts.includes(releaseName)) {
                let cmd = `helm upgrade ${releaseName} -n ${namespaceName} ${chartPath} ${valuesArg}`
                this.logger.showUser(chalk.cyan(`Upgrading ${releaseName} chart`))

                let output = await this.run(cmd)
                this.logger.showUser(chalk.green('OK'), `chart '${releaseName}' is upgraded`)
                await this.getInstalledCharts(namespaceName)

                this.logger.showUser(chalk.yellow("Chart upgrade is complete"))
            } else {
                this.logger.showUser(chalk.green('OK'), `chart '${releaseName}' is not installed`)
                return false
            }

            return true
        } catch (e) {
            this.logger.error("%s", e.stack)
            this.logger.showUser(e.message)
        }

        return false
    }


    constructor(opts) {
        super();

        if (opts.logger === undefined) throw new Error("logger cannot be null")

        this.logger = opts.logger

        // map of dependency checks
        this.checks = new Map()
            .set(core.constants.KIND, () => this.checkKind())
            .set(core.constants.HELM, () => this.checkHelm())
            .set(core.constants.KUBECTL, () => this.checkKubectl())
    }
}
