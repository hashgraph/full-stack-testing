"use strict"
import * as core from "../core/index.mjs"
import chalk from "chalk";
import {ShellRunner} from "../core/shell_runner.mjs";

export class BaseCommand extends ShellRunner {
    async checkDep(cmd) {
        try {
            this.logger.debug(cmd)
            await this.run(cmd)
        } catch (e) {
            this.logger.showUserError(e)
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
            const dep = deps[i]
            this.logger.debug("Checking for dependency '%s'", dep)

            let status = false
            const check = this.checks.get(dep)
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
            return await this.helm.list(`-n ${namespaceName}`, '-q')
        } catch (e) {
            this.logger.showUserError(e)
        }

        return []
    }

    async chartInstall(namespaceName, chartName, chartPath, valuesArg = '') {
        try {
            const charts = await this.getInstalledCharts(namespaceName)
            if (!charts.includes(chartName)) {
                this.logger.showUser(chalk.cyan('> running helm dependency update for chart:'), chalk.yellow(`${chartName} ...`))
                await this.helm.dependency('update', chartPath)

                this.logger.showUser(chalk.cyan('> installing chart:'), chalk.yellow(`${chartName}`))
                await this.helm.install(`-n ${namespaceName} ${chartName} ${chartPath} ${valuesArg}`)
                this.logger.showUser(chalk.green('OK'), `chart '${chartName}' is installed`)
            } else {
                this.logger.showUser(chalk.green('OK'), `chart '${chartName}' is already installed`)
            }

            return true
        } catch (e) {
            this.logger.showUserError(e)
        }

        return false
    }

    async chartUninstall(namespaceName, chartName) {
        try {
            this.logger.showUser(chalk.cyan('> checking chart:'), chalk.yellow(`${chartName}`))
            const charts = await this.getInstalledCharts(namespaceName)
            if (charts.includes(chartName)) {
                this.logger.showUser(chalk.cyan('> uninstalling chart:'), chalk.yellow(`${chartName}`))
                await this.helm.uninstall(`-n ${namespaceName} ${chartName}`)
                this.logger.showUser(chalk.green('OK'), `chart '${chartName}' is uninstalled`)
            } else {
                this.logger.showUser(chalk.green('OK'), `chart '${chartName}' is already uninstalled`)
            }

            return true
        } catch (e) {
            this.logger.showUserError(e)
        }

        return false
    }

    async chartUpgrade(namespaceName, chartName, chartPath, valuesArg = '') {
        try {
            this.logger.showUser(chalk.cyan('> upgrading chart:'), chalk.yellow(`${chartName}`))
            await this.helm.upgrade(`-n ${namespaceName} ${chartName} ${chartPath} ${valuesArg}`)
            this.logger.showUser(chalk.green('OK'), `chart '${chartName}' is upgraded`)

            return true
        } catch (e) {
            this.logger.showUserError(e)
        }

        return false
    }

    constructor(opts) {
        if (!opts || !opts.logger) throw new Error('An instance of core/Logger is required')
        if (!opts || !opts.kind) throw new Error('An instance of core/Kind is required')
        if (!opts || !opts.helm) throw new Error('An instance of core/Helm is required')
        if (!opts || !opts.kubectl) throw new Error('An instance of core/Kubectl is required')

        super(opts.logger);

        this.kind = opts.kind
        this.helm = opts.helm
        this.kubectl = opts.kubectl

        // map of dependency checks
        this.checks = new Map()
            .set(core.constants.KIND, () => this.checkKind())
            .set(core.constants.HELM, () => this.checkHelm())
            .set(core.constants.KUBECTL, () => this.checkKubectl())
    }
}
