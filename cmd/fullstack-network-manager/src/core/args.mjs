import * as core from './index.mjs'

export const clusterName = {
    describe: 'Name of the cluster',
    default: core.constants.FST_CLUSTER_NAME,
    alias: 'n',
    type: 'string'
}

