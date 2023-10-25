import {BaseCommand} from "./base.mjs";
import chalk from "chalk";


export const NetworkCommand = class NetworkCommand extends BaseCommand {

    async deploy(argv) {
        this.logger.showUser(chalk.green("Deploying FST network....%s"), chalk.yellow(JSON.stringify(argv)))
        return false
    }

    static getCommandDefinition(networkCmd) {
        return {
            command: 'network',
            desc: 'Manage FST network deployment',
            builder: yargs => {
                return yargs
                    .command({
                        command: 'deploy',
                        desc: 'Deploy a FST network',
                        builder: yargs => {
                            yargs.option('haproxy', {
                                describe: 'Deploy HAProxy',
                                default: true,
                                alias: 'p',
                                type: 'boolean'
                            })

                            yargs.option('envoy-proxy', {
                                describe: 'Deploy Envoy proxy',
                                default: true,
                                alias: 'e',
                                type: 'boolean'
                            })

                            yargs.option('mirror-node', {
                                describe: 'Deploy mirror node',
                                default: true,
                                alias: 'm',
                                type: 'boolean'
                            })
                            yargs.option('hedera-explorer', {
                                describe: 'Deploy hedera explorer',
                                default: true,
                                alias: 'x',
                                type: 'boolean'
                            })
                        },
                        handler: argv => {
                            networkCmd.deploy(argv).then(r => {
                                if (!r) process.exit(1)
                            })
                        }
                    })
                    .demand(1, 'Select a network command')
            }
        }
    }
}