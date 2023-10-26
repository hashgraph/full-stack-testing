import * as core from '../core/index.mjs'
import {BaseCommand} from "./base.mjs";
import chalk from "chalk";

/**
 * Flags for 'cluster' command
 */
const clusterNameFlag = {
    describe: 'Name of the cluster',
    default: core.constants.CLUSTER_NAME,
    alias: 'c',
    type: 'string'
}

const namespaceFlag = {
    describe: 'Name of the namespace',
    default: core.constants.NAMESPACE_NAME,
    alias: 's',
    type: 'string'
}

/**
 * Define the core functionalities of 'cluster' command
 */
export const ClusterCommand = class extends BaseCommand {
    /**
     * List available clusters
     * @returns {Promise<string[]>}
     */
    async getClusters() {
        try {
            let cmd = `kind get clusters -q`

            let output = await this.runExec(cmd)
            this.logger.showUser("\nList of available clusters \n--------------------------\n%s", output)

            return output.split(/\r?\n/)
        } catch (e) {
            this.logger.error("%s", e)
            this.logger.showUser(e.message)
        }

        return []
    }

    /**
     * Get cluster-info for the given cluster name
     * @param argv arguments containing cluster name
     * @returns {Promise<boolean>}
     */
    async getClusterInfo(argv) {
        try {
            let clusterName = argv.clusterName
            let cmd = `kubectl cluster-info --context kind-${clusterName}`

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
        try {
            let clusterName = argv.clusterName
            let cmd = `kind create cluster -n ${clusterName} --config ${core.constants.RESOURCES_DIR}/dev-cluster.yaml`

            this.logger.showUser(chalk.cyan('Creating cluster:'), chalk.yellow(`${clusterName}...`))
            let output = await this.runExec(cmd)
            this.logger.debug(output)
            this.logger.showUser(chalk.green('Created cluster:'), chalk.yellow(clusterName))

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
        try {
            let clusterName = argv.clusterName
            let cmd = `kind delete cluster -n ${clusterName}`

            this.logger.showUser(chalk.cyan('Deleting cluster:'), chalk.yellow(`${clusterName}...`))
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
     * Setup cluster with shared components
     * @param argv
     * @returns {Promise<boolean>}
     */
    async setup(argv) {
        let clusterName = argv.clusterName
        let releaseName = "fullstack-cluster-setup"
        let namespaceName = argv.namespace
        let chartPath = `${core.constants.FST_HOME_DIR}/full-stack-testing/charts/fullstack-cluster-setup`
        return this.installChart(clusterName, namespaceName, releaseName, chartPath)
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
                            yargs.option('cluster-name', clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.logger.debug("==== Running 'cluster create' ===")
                            clusterCmd.logger.debug(argv)

                            clusterCmd.create(argv).then(r => {
                                if (!r) process.exit(1)
                            })

                            clusterCmd.logger.debug("==== Finished running `cluster create`====")
                        }
                    })
                    .command({
                        command: 'delete',
                        desc: 'Delete a cluster',
                        builder: yargs => {
                            yargs.option('cluster-name', clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.logger.debug("==== Running 'cluster delete' ===")
                            clusterCmd.logger.debug(argv)

                            clusterCmd.delete(argv).then(r => {
                                if (!r) process.exit(1)
                            })

                            clusterCmd.logger.debug("==== Finished running `cluster delete`====")
                        }
                    })
                    .command({
                        command: 'list',
                        desc: 'List all clusters',
                        handler: argv => {
                            clusterCmd.logger.debug("==== Running 'cluster list' ===")
                            clusterCmd.logger.debug(argv)

                            clusterCmd.getClusters().then(r => {
                                if (!r) process.exit(1)
                            })

                            clusterCmd.logger.debug("==== Finished running `cluster list`====")
                        }
                    })
                    .command({
                        command: 'info',
                        desc: 'Get cluster info',
                        builder: yargs => {
                            yargs.option('cluster-name', clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.logger.debug("==== Running 'cluster info' ===")
                            clusterCmd.logger.debug(argv)

                            clusterCmd.getClusterInfo(argv).then(r => {
                                if (!r) process.exit(1)
                            })

                            clusterCmd.logger.debug("==== Finished running `cluster info`====")
                        }
                    })
                    .command({
                        command: 'setup',
                        desc: 'Setup cluster with shared components',
                        builder: yargs => {
                            yargs.option('cluster-name', clusterNameFlag)
                            yargs.option('namespace', namespaceFlag)
                        },
                        handler: argv => {
                            clusterCmd.logger.debug("==== Running 'cluster setup' ===")
                            clusterCmd.logger.debug(argv)

                            clusterCmd.setup(argv).then(r => {
                                if (!r) process.exit(1)
                            })

                            clusterCmd.logger.debug("==== Finished running `cluster setup`====")
                        }
                    })
                    .demand(1, 'Select a cluster command')
            }
        }
    }
}
