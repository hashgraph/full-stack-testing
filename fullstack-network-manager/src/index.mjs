import yargs from 'yargs';
import {hideBin} from 'yargs/helpers'
import * as commands from './commands/index.mjs'
import * as core from './core/index.mjs'

export function main(argv) {
    const logger = core.logging.NewLogger('debug')
    const opts = {
        logger: logger
    }

    logger.debug("Constants: %s", JSON.stringify(core.constants))

    return yargs(hideBin(argv))
        .usage('Usage: $0 <command> [options]')
        .alias('h', 'help')
        .alias('v', 'version')
        .command(commands.Initialize(opts))
        .strict()
        .wrap(80)
        .demand(1, 'Select a command')
        .parse()
}
