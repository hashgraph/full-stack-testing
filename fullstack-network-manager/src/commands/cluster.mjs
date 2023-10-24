import * as core from '../core/index.mjs'
import {BaseCommand} from "./base.mjs";

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
     * Create a cluster
     * @param argv
     * @returns {Promise<boolean>}
     */
    async create(argv) {
        let cmd = `kind create cluster -n ${argv.name} --config ${core.constants.RESOURCES_DIR}/dev-cluster.yaml`

        try {
            this.showUser(`Invoking '${cmd}'...`)
            let output = await this.runExec(cmd)
            this.logger.debug(output)

            this.showUser("Created cluster '%s'\n", argv.name)
            output = await this.runExec(`kubectl cluster-info --context kind-${argv.name}`)
            this.showUser(output)

            return true
        } catch (e) {
            this.logger.error("%s", e)
            this.showUser(e.message)
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
            this.showUser(`Invoking '${cmd}'...`)
            let output = await this.runExec(cmd)
            this.showUser(output)
            this.showUser("Deleted cluster '%s' (if it existed)", argv.name)
            return true
        } catch (e) {
            this.logger.error("%s", e.stack)
            this.showUser(e.message)
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
            desc: 'Manager FST cluster',
            builder: yargs => {
                return yargs
                    .command({
                        command: 'create',
                        desc: 'Create FST cluster',
                        builder: yargs => {
                            yargs.option('name', clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.create(argv).then()
                        }
                    })
                    .command({
                        command: 'delete',
                        desc: 'Delete FST cluster',
                        builder: yargs => {
                            yargs.option('name', clusterNameFlag)
                        },
                        handler: argv => {
                            clusterCmd.delete(argv).then()
                        }
                    })
                    .demand(1, 'Select a cluster command')
            }
        }
    }
}
