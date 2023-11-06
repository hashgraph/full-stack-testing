import yargs from 'yargs';
import {hideBin} from 'yargs/helpers'
import * as commands from './commands/index.mjs'
import * as core from './core/index.mjs'

export function main(argv) {
    const logger = core.logging.NewLogger('debug')
    const kind = new core.Kind({logger: logger})
    const helm = new core.Helm({logger: logger})
    const kubectl= new core.Kubectl({logger: logger})
    const downloader = new core.PackageDownloader(logger)

    const opts = {
        logger: logger,
        kind: kind,
        helm: helm,
        kubectl: kubectl,
        downloader: downloader,
    }

    logger.debug("Constants: %s", JSON.stringify(core.constants))

    return yargs(hideBin(argv))
        .usage(`Usage:\n  $0 <command> [options]`)
        .alias('h', 'help')
        .alias('v', 'version')
        .command(commands.Initialize(opts))
        .strict()
        .wrap(120)
        .demand(1, 'Select a command')
        .parse()
}
