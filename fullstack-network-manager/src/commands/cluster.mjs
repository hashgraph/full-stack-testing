import * as core from '../core/index.mjs'
import * as flags from './flags.mjs'
import {BaseCommand} from "./base.mjs";
import chalk from "chalk";
import {Kind} from "../core/kind.mjs";

/**
 * Define the core functionalities of 'cluster' command
 */
export class ClusterCommand extends BaseCommand {
    /**
     * List available clusters
     * @returns {Promise<string[]>}
     */
    async getClusters() {
        try {
            return await this.kind.getClusters('-q')
        } catch (e) {
            this.logger.showUserError(e)
        }

        return []
    }

    showList(itemType, items = []) {
        this.logger.showUser(chalk.green(`\n *** List of available ${itemType} ***`))
        this.logger.showUser(chalk.green(`---------------------------------------`))
        if (items.length > 0) {
            items.forEach(name => this.logger.showUser(chalk.yellow(` - ${name}`)))
        } else {
            this.logger.showUser(chalk.blue(`[ None ]`))
        }

        this.logger.showUser("\n")
        return true
    }

    async showClusterList(argv) {
        this.showList("clusters", await this.getClusters())
        return true
    }

    /**
     * List available namespaces
     * @returns {Promise<string[]>}
     */
    async getNameSpaces() {
        try {
            return await this.kubectl.getNamespace(`--no-headers`, `-o name`)
        } catch (e) {
            this.logger.showUserError(e)
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

            this.logger.showUser(`Cluster information (${clusterName})\n---------------------------------------`)
            output.forEach(line => this.logger.showUser(line))
            this.logger.showUser("\n")
            return true
        } catch (e) {
            this.logger.showUserError(e)
        }

        return false
    }

    async createNamespace(argv) {
        try {
            let namespace = argv.namespace
            let namespaces = await this.getNameSpaces()
            this.logger.showUser(chalk.cyan('> checking namespace:'), chalk.yellow(`${namespace}`))
            if (!namespaces.includes(`namespace/${namespace}`)) {
                this.logger.showUser(chalk.cyan('> creating namespace:'), chalk.yellow(`${namespace} ...`))
                await this.kubectl.createNamespace(namespace)
                this.logger.showUser(chalk.green('OK'), `namespace '${namespace}' is created`)
            } else {
                this.logger.showUser(chalk.green('OK'), `namespace '${namespace}' already exists`)
            }

            this.showList("namespaces", await this.getNameSpaces())

            return true
        } catch (e) {
            this.logger.showUserError(e)
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
            let clusters = await this.getClusters()

            this.logger.showUser(chalk.cyan('> checking cluster:'), chalk.yellow(`${clusterName}`))
            if (!clusters.includes(clusterName)) {
                this.logger.showUser(chalk.cyan('> creating cluster:'), chalk.yellow(`${clusterName} ...`))
                await this.kind.createCluster(
                    `-n ${clusterName}`,
                    `--config ${core.constants.RESOURCES_DIR}/dev-cluster.yaml`,
                )
                this.logger.showUser(chalk.green('OK'), `cluster '${clusterName}' is created`)
            } else {
                this.logger.showUser(chalk.green('OK'), `cluster '${clusterName}' already exists`)
            }

            // show all clusters and cluster-info
            await this.showClusterList()

            await this.getClusterInfo(argv)

            await this.createNamespace(argv)

            return true
        } catch (e) {
            this.logger.showUserError(e)
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
            this.logger.showUser(chalk.cyan('> checking cluster:'), chalk.yellow(`${clusterName}`))
            if (clusters.includes(clusterName)) {
                this.logger.showUser(chalk.cyan('> deleting cluster:'), chalk.yellow(`${clusterName} ...`))
                await this.kind.deleteCluster(clusterName)
                this.logger.showUser(chalk.green('OK'), `cluster '${clusterName}' is deleted`)
            } else {
                this.logger.showUser(chalk.green('OK'), `cluster '${clusterName}' is already deleted`)
            }

            this.showList('clusters', await this.getClusters())

            return true
        } catch (e) {
            this.logger.showUserError(e)
        }

        return false
    }


    async showInstalledChartList(namespace) {
        this.showList("charts installed", await this.getInstalledCharts(namespace))
    }

    /**
     * Setup cluster with shared components
     * @param argv
     * @returns {Promise<boolean>}
     */
    async setup(argv) {
        try {
            // create cluster
            await this.create(argv)

            let clusterName = argv.clusterName
            let chartName = "fullstack-cluster-setup"
            let namespace = argv.namespace
            let chartPath = `${core.constants.FST_HOME_DIR}/full-stack-testing/charts/${chartName}`
            let valuesArg = this.prepareValuesArg(argv.prometheusStack, argv.minio)

            this.logger.showUser(chalk.cyan('> setting up cluster:'), chalk.yellow(`${clusterName}`))
            await this.chartInstall(namespace, chartName, chartPath, valuesArg)
            await this.showInstalledChartList(namespace)

            return true
        } catch (e) {
            this.logger.showUserError(e)
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
                            yargs.option('namespace', flags.namespaceFlag)
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
                            yargs.option('prometheus-stack', flags.deployPrometheusStack)
                            yargs.option('minio', flags.deployMinio)
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

    prepareValuesArg(prometheusStackEnabled, minioEnabled) {
        return ` --set cloud.prometheusStack.enabled=${prometheusStackEnabled} --set cloud.minio.enabled=${minioEnabled}`
    }
}
