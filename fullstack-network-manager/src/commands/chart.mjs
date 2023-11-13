import {BaseCommand} from "./base.mjs";
import * as core from "../core/index.mjs";
import * as flags from "./flags.mjs";
import {constants} from "../core/index.mjs";


export class ChartCommand extends BaseCommand {
    chartPath = `full-stack-testing/fullstack-deployment`

    prepareValuesArg(argv) {
        const {valuesFile, mirrorNode, hederaExplorer} = argv

        let valuesArg = ''
        if (valuesFile) {
            valuesArg += `--values ${valuesFile}`
        }

        valuesArg += ` --set hedera-mirror-node.enabled=${mirrorNode} --set hedera-explorer.enabled=${hederaExplorer}`

        return valuesArg
    }

    async install(argv) {
        try {
            const namespace = argv.namespace
            const valuesArg = this.prepareValuesArg(argv)

            await this.chartManager.install(namespace, constants.FST_CHART_DEPLOYMENT_NAME, this.chartPath, valuesArg)

            this.logger.showList('charts', await this.chartManager.getInstalledCharts(namespace))
        } catch (e) {
            this.logger.showUserError(e)
        }
    }

    async uninstall(argv) {
        const namespace = argv.namespace

        return await this.chartManager.uninstall(namespace, constants.FST_CHART_DEPLOYMENT_NAME)
    }

    async upgrade(argv) {
        const namespace = argv.namespace
        const valuesArg = this.prepareValuesArg(argv)

        return await this.chartManager.upgrade(namespace, constants.FST_CHART_DEPLOYMENT_NAME, this.chartPath, valuesArg)
    }

    static getCommandDefinition(chartCmd) {
        return {
            command: 'chart',
            desc: 'Manage FST chart deployment',
            builder: yargs => {
                return yargs
                    .command({
                        command: 'install',
                        desc: 'Install FST network deployment chart',
                        builder: yargs => {
                            yargs.option('namespace', flags.namespaceFlag)
                            yargs.option('mirror-node', flags.deployMirrorNode)
                            yargs.option('hedera-explorer', flags.deployHederaExplorer)
                            yargs.option('values-file', flags.valuesFile)
                        },
                        handler: argv => {
                            chartCmd.logger.debug("==== Running 'chart install' ===")
                            chartCmd.logger.debug(argv)

                            chartCmd.install(argv).then(r => {
                                chartCmd.logger.debug("==== Finished running `chart install`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .command({
                        command: 'uninstall',
                        desc: 'Uninstall FST network deployment chart',
                        builder: yargs => {
                            yargs.option('namespace', flags.namespaceFlag)
                        },
                        handler: argv => {
                            chartCmd.logger.debug("==== Running 'chart uninstall' ===")
                            chartCmd.logger.debug(argv)

                            chartCmd.uninstall(argv).then(r => {
                                chartCmd.logger.debug("==== Finished running `chart uninstall`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .command({
                        command: 'upgrade',
                        desc: 'Refresh existing FST network deployment with new values',
                        builder: yargs => {
                            yargs.option('namespace', flags.namespaceFlag)
                            yargs.option('mirror-node', flags.deployMirrorNode)
                            yargs.option('hedera-explorer', flags.deployHederaExplorer)
                            yargs.option('values-file', flags.valuesFile)
                        },
                        handler: argv => {
                            chartCmd.logger.debug("==== Running 'chart upgrade' ===")
                            chartCmd.logger.debug(argv)

                            chartCmd.upgrade(argv).then(r => {
                                chartCmd.logger.debug("==== Finished running `chart upgrade`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .demandCommand(1, 'Select a chart command')
            }
        }
    }
}