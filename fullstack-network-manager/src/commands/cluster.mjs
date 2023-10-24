import * as core from '../core/index.mjs'
import {BaseCommand} from "./base.mjs";
import chalk from "chalk";

/**
 * Flags for 'cluster' command
 */
const clusterNameFlag = {
    describe: 'Name of the cluster',
    default: core.constants.CLUSTER_NAME,
    alias: 'n',
    type: 'string'
}

/**
 * Define the core functionalities of 'cluster' command
 */
export const ClusterCommand = class extends BaseCommand {

    /**
     * List available clusters
     * @returns {Promise<boolean>}
     */
    async getClusters() {
        let cmd = `kind get clusters`

        try {
            let output = await this.runExec(cmd)
            this.logger.showUser("\nList of available clusters \n--------------------------\n%s", output)
            return true
        } catch (e) {
            this.logger.error("%s", e)
            this.logger.showUser(e.message)
        }

        return false
    }

    /**
     * Get cluster-info for the given cluster name
     * @param argv arguments containing cluster name
     * @returns {Promise<boolean>}
     */
    async getClusterInfo(argv) {
        let cmd = `kubectl cluster-info --context kind-${argv.name}`

        try {
            let output = await this.runExec(cmd)
            this.logger.showUser(output)
            return true
        } catch (e) {
            this.logger.error("%s", e)
            this.logger.showUser(e.message)
        }

        return false
    }

    /**
     * Create a cluster
     * @param argv
     * @returns {Promise<boolean>}
     */
    async create(argv) {
        let cmd = `kind create cluster -n ${argv.name} --config ${core.constants.RESOURCES_DIR}/dev-cluster.yaml`

        try {
            this.logger.showUser(chalk.cyan('Creating cluster:'), chalk.yellow(`${argv.name}...`))
            this.logger.debug(`Invoking '${cmd}'...`)
            let output = await this.runExec(cmd)
            this.logger.debug(output)
            this.logger.showUser(chalk.green('Created cluster:'), chalk.yellow(argv.name))

            // show all clusters and cluster-info
            await this.getClusters()
            await this.getClusterInfo(argv)

            return true
        } catch (e) {
            this.logger.error("%s", e)
            this.logger.showUser(e.message)
        }

        return false
    }

    /**
     * Delete a cluster
     * @param argv
     * @returns {Promise<boolean>}
     */
    async delete(argv) {
        let cmd = `kind delete cluster -n ${argv.name}`
        try {
            this.logger.debug(`Invoking '${cmd}'...`)
            this.logger.showUser(chalk.cyan('Deleting cluster:'), chalk.yellow(`${argv.name}...`))
            await this.runExec(cmd)
            await this.getClusters()

            return true
        } catch (e) {
            this.logger.error("%s", e.stack)
            this.logger.showUser(e.message)
        }

        return false
    }

    /**
     * Return Yargs command definition for 'cluster' command
     * @param clusterCmd an instance of ClusterCommand
     */
    static getCommandDefinition(clusterCmd) {
        return {
            command: 'cluster',
            desc: 'Manage FST cluster',
            builder: yargs => {
                return yargs
                    .command({
                        command: 'create',
                        desc: 'Create a cluster',
                        builder: yargs => {
                            yargs.option('name', clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.create(argv).then(r => {
                                if (!r) process.exit(1)
                            })
                        }
                    })
                    .command({
                        command: 'delete',
                        desc: 'Delete a cluster',
                        builder: yargs => {
                            yargs.option('name', clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.delete(argv).then(r => {
                                if (!r) process.exit(1)
                            })
                        }
                    })
                    .command({
                        command: 'list',
                        desc: 'List all clusters',
                        handler: argv => {
                            clusterCmd.getClusters().then(r => {
                                if (!r) process.exit(1)
                            })
                        }
                    })
                    .command({
                        command: 'info',
                        desc: 'Get cluster info',
                        builder: yargs => {
                            yargs.option('name', clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.getClusterInfo(argv).then(r => {
                                if (!r) process.exit(1)
                            })
                        }
                    })
                    .demand(1, 'Select a cluster command')
            }
        }
    }
}
