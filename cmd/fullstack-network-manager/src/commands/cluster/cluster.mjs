// Cluster_class class
import * as core from '../../core/index.mjs'
const Cluster_class = class {
    static create(argv) {
        core.logger.info( "creating cluster '%s'", argv.name)
    }

    static delete(argv) {
        core.logger.info( "deleting cluster '%s'", argv.name, { name: argv.name})
    }
}

export { Cluster_class }