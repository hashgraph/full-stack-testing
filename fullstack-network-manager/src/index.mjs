import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

import * as core from './core/index.mjs'
import * as init from './commands/init/index.mjs';
import * as cluster from './commands/cluster/index.mjs';

export const commands = [
    init.InitCmd,
    cluster.ClusterCmd,
]

export const cli = yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .alias('h', 'help')
    .alias('v', 'version')
    .command(commands)
    .strict()
    .wrap(80)
    .demand(1, 'Select a command')
    .parse()
