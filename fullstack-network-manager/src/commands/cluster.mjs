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
     * @returns {Promise<void>}
     */
    async create(argv) {
        this.logger.info("creating cluster '%s'", argv.name)
    }

    /**
     * Delete a cluster
     * @param argv
     * @returns {Promise<void>}
     */
    async delete(argv) {
        this.logger.info("deleting cluster '%s'", argv.name, {name: argv.name})
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
