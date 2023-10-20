// Cluster_class class
import * as core from '../../core/index.mjs'

export const Cluster = class {
    static create(argv) {
        core.logger.info("creating cluster '%s'", argv.name)
    }

    static delete(argv) {
        core.logger.info("deleting cluster '%s'", argv.name, {name: argv.name})
    }
}
