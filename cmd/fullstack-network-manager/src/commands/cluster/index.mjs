import { Cluster } from './cluster.mjs'
import * as cmdArgs from '../../core/args.mjs'

const createSubCmd = {
    command: 'create',
    desc: 'Create FST cluster',
    builder: yargs => {
        yargs.option('name', cmdArgs.clusterName)
    },
    handler: argv => {
        Cluster.create(argv)
    }
}

const deleteSubCmd = {
    command: 'delete',
    desc: 'Delete FST cluster',
    builder: yargs => {
        yargs.option('name', cmdArgs.clusterName)
    },
    handler: argv => {
        Cluster.delete(argv)
    }
}

const ClusterCmd = {
    command: 'cluster',
    desc: 'Manager FST cluster',
    builder: yargs => {
        return yargs
            .command(createSubCmd)
            .command(deleteSubCmd)
            .demand(1, 'Select a cluster command')
    },
}

export { ClusterCmd }
