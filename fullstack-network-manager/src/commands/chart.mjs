import {BaseCommand} from "./base.mjs";
import chalk from "chalk";
import * as core from "../core/index.mjs";
import * as flags from "./flags.mjs";


export class ChartCommand extends BaseCommand {
    chartPath = `${core.constants.FST_HOME_DIR}/full-stack-testing/charts/fullstack-deployment`
    releaseName = "fullstack-deployment"

    prepareValuesArg(argv) {
        let {valuesFile, mirrorNode, hederaExplorer} = argv
        let valuesArg = `--values ${this.chartPath}/values.yaml`

        if (valuesFile) {
            valuesArg += ` --values ${valuesFile}`
        }

        valuesArg += ` --set hedera-mirror-node.enable=${mirrorNode} --set hedera-explorer.enable=${hederaExplorer}`

        return valuesArg
    }

    async install(argv) {
        let namespace = argv.namespace
        let valuesArg = this.prepareValuesArg(argv)

        await this.helm.dependency('update', this.chartPath)
        return await this.chartInstall(namespace, this.releaseName, this.chartPath, valuesArg)
    }

    async uninstall(argv) {
        let namespace = argv.namespace

        return await this.chartUninstall(namespace, this.releaseName)
    }

    async upgrade(argv) {
        let namespace = argv.namespace
        let valuesArg = this.prepareValuesArg(argv)

        return await this.chartUpgrade(namespace, this.releaseName, this.chartPath, valuesArg)
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
                    .demand(1, 'Select a chart command')
            }
        }
    }
}