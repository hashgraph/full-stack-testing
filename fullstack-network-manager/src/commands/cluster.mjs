import * as core from '../core/index.mjs'
import * as flags from './flags.mjs'
import {BaseCommand} from "./base.mjs";
import chalk from "chalk";
import {Kind} from "../core/kind.mjs";

/**
 * Define the core functionalities of 'cluster' command
 */
export class ClusterCommand extends BaseCommand {

    constructor(opts) {
        super(opts);
        this.kind = new Kind(opts)
    }

    /**
     * List available clusters
     * @returns {Promise<string[]>}
     */
    async getClusters() {
        try {
            return await this.kind.getClusters('-q')
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
            let output = await this.run(cmd)

            this.logger.showUser(`\nCluster information (${clusterName})\n---------------------------------------`)
            output.forEach(line => this.logger.showUser(line))
            return true
        } catch (e) {
            this.logger.error("%s", e)
            this.logger.showUser(e.message)
        }

        return false
    }

    async showClusterList(argv) {
        let clusters = await this.getClusters()
        this.logger.showUser("\nList of available clusters \n---------------------------------------")
        clusters.forEach(name => this.logger.showUser(name))
    }
    /**
     * Create a cluster
     * @param argv
     * @returns {Promise<boolean>}
     */
    async create(argv) {
        try {
            let clusterName = argv.clusterName
            let clusters = await this.getClusters()

            if (!clusters.includes(clusterName)) {
                this.logger.showUser(chalk.cyan('Creating cluster:'), chalk.yellow(`${clusterName}...`))
                await this.kind.createCluster(
                    `-n ${clusterName}`,
                    `--config ${core.constants.RESOURCES_DIR}/dev-cluster.yaml`,
                )
                this.logger.showUser(chalk.green('Created cluster:'), chalk.yellow(clusterName))
            }

            // show all clusters and cluster-info
            await this.showClusterList()

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
            let clusters = await this.getClusters()
            if (clusters.includes(clusterName)) {
                this.logger.showUser(chalk.cyan('Deleting cluster:'), chalk.yellow(`${clusterName}...`))
                await this.kind.deleteCluster(clusterName)
                await this.showClusterList()
            } else {
                this.logger.showUser(`Cluster '${clusterName}' does not exist`)
            }


            return true
        } catch (e) {
            this.logger.error("%s", e.stack)
            this.logger.showUser(e.message)
        }

        return false
    }

    /**
     * List available clusters
     * @returns {Promise<string[]>}
     */
    async getInstalledCharts(argv) {
        try {
            let namespaceName = argv.namespace
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

    /**
     * Setup cluster with shared components
     * @param argv
     * @returns {Promise<boolean>}
     */
    async setup(argv) {
        try {
            let clusterName = argv.clusterName
            let releaseName = "fullstack-cluster-setup"
            let namespaceName = argv.namespace
            let chartPath = `${core.constants.FST_HOME_DIR}/full-stack-testing/charts/fullstack-cluster-setup`

            this.logger.showUser(chalk.cyan(`Setting up cluster ${clusterName}...`))

            let charts= await this.getInstalledCharts(argv)

            if (!charts.includes(releaseName)) {
                // install fullstack-cluster-setup chart
                let cmd = `helm install -n ${namespaceName} ${releaseName} ${chartPath}`
                this.logger.showUser(chalk.cyan("Installing fullstack-cluster-setup chart"))
                this.logger.debug(`Invoking '${cmd}'...`)

                let output = await this.run(cmd)
                this.logger.showUser(chalk.green('OK'), `chart '${releaseName}' is installed`)
            } else {
                this.logger.showUser(chalk.green('OK'), `chart '${releaseName}' is already installed`)
            }

            this.logger.showUser(chalk.yellow("Chart setup complete"))

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
                            yargs.option('cluster-name', flags.clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.logger.debug("==== Running 'cluster create' ===")
                            clusterCmd.logger.debug(argv)

                            clusterCmd.create(argv).then(r => {
                                clusterCmd.logger.debug("==== Finished running `cluster create`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .command({
                        command: 'delete',
                        desc: 'Delete a cluster',
                        builder: yargs => {
                            yargs.option('cluster-name', flags.clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.logger.debug("==== Running 'cluster delete' ===")
                            clusterCmd.logger.debug(argv)

                            clusterCmd.delete(argv).then(r => {
                                clusterCmd.logger.debug("==== Finished running `cluster delete`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .command({
                        command: 'list',
                        desc: 'List all clusters',
                        handler: argv => {
                            clusterCmd.logger.debug("==== Running 'cluster list' ===")
                            clusterCmd.logger.debug(argv)

                            clusterCmd.showClusterList().then(r => {
                                clusterCmd.logger.debug("==== Finished running `cluster list`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .command({
                        command: 'info',
                        desc: 'Get cluster info',
                        builder: yargs => {
                            yargs.option('cluster-name', flags.clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.logger.debug("==== Running 'cluster info' ===")
                            clusterCmd.logger.debug(argv)

                            clusterCmd.getClusterInfo(argv).then(r => {
                                clusterCmd.logger.debug("==== Finished running `cluster info`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .command({
                        command: 'setup',
                        desc: 'Setup cluster with shared components',
                        builder: yargs => {
                            yargs.option('cluster-name', flags.clusterNameFlag)
                            yargs.option('namespace', flags.namespaceFlag)
                        },
                        handler: argv => {
                            clusterCmd.logger.debug("==== Running 'cluster setup' ===")
                            clusterCmd.logger.debug(argv)

                            clusterCmd.setup(argv).then(r => {
                                clusterCmd.logger.debug("==== Finished running `cluster setup`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .demand(1, 'Select a cluster command')
            }
        }
    }
}
