import {BaseCommand} from "./base.mjs";
import * as flags from "./flags.mjs";
import {IllegalArgumentError, MissingArgumentError} from "../core/errors.mjs";
import {constants} from "../core/index.mjs";

/**
 * Defines the core functionalities of 'node' command
 */
export class NodeCommand extends BaseCommand {
    constructor(opts) {
        super(opts);

        if (!opts || !opts.downloader) throw new IllegalArgumentError('An instance of core/PackageDowner is required', opts.downloader)
        if (!opts || !opts.platformInstaller) throw new IllegalArgumentError('An instance of core/PlatformInstaller is required', opts.platformInstaller)

        this.downloader = opts.downloader
        this.plaformInstaller = opts.platformInstaller
    }

    async getNetworkNodePodNames(namespace, nodeIds = [], timeout='300s') {
        return new Promise(async (resolve, reject) => {
            try {
                let podNames = []
                if (nodeIds.length > 0) {
                    for (const nodeId of nodeIds) {
                        // kubectl wait --for=jsonpath='{.status.phase}'=Running pod -l fullstack.hedera.com/type=network-node --timeout=300s -n "${NAMESPACE}" || return "${EX_ERR}"
                        const podName = `network-node-${nodeId}`
                        let status = await this.kubectl.wait('pod',
                            `--for=jsonpath='{.status.phase}'=Running`,
                            `-l fullstack.hedera.com/type=network-node`,
                            `-l fullstack.hedera.com/node-name=${nodeId}`,
                            `--timeout=${timeout}`,
                            `-n "${namespace}"`
                        )
                        podNames.push(podName)
                    }
                } else {
                    let output = await this.kubectl.get('pods', `-l fullstack.hedera.com/type=network-node`, '--no-headers', `-o custom-columns=":metadata.name"` )
                    output.forEach(item => podNames.push(item.trim()))
                }

                resolve(podNames)
            } catch (e) {
                reject(e)
            }

        })
    }

    async setup(argv) {
        const self = this
        if (!argv.releaseTag && !argv.releaseDir) throw new MissingArgumentError('release-tag or release-dir argument is required')

        const namespace = argv.namespace
        try {
            const nodeIDs = argv.nodeIds ? argv.nodeIds.split(',') : []
            const pods = await this.getNetworkNodePodNames(namespace, nodeIDs)
            for (const pod of pods) {
                let releaseDir = argv.releaseDir
                if (argv.releaseTag !== '') {
                    const packagePath = await this.downloader.fetchPlatform(argv.releaseTag, constants.FST_HEDERA_RELEASES_DIR)
                    let releaseDir = `${packagePath}/unzipped`
                    await this.unzipFile(packagePath, releaseDir)
                }

                await self.plaformInstaller.install(pod, releaseDir);
            }
        } catch (e) {
            this.logger.showUserError(e)
        }

        return false
    }

    async start(argv) {

    }

    async stop(argv) {

    }

    /**
     * Return Yargs command definition for 'node' command
     * @param nodeCmd an instance of NodeCommand
     */
    static getCommandDefinition(nodeCmd) {
        return {
            command: "node",
            desc: "Manage a FST node running Hedera platform",
            builder: yargs => {
                return yargs
                    .command({
                        command: 'setup',
                        desc: 'Setup node with a specific version of Hedera platform',
                        builder: yargs => {
                            yargs.option('namespace', flags.namespaceFlag)
                            yargs.option('node-ids', flags.nodeIDs)
                            yargs.option('release-tag', flags.platformReleaseTag)
                            yargs.option('release-dir', flags.platformReleaseDir)
                        },
                        handler: argv => {
                            nodeCmd.logger.debug("==== Running 'node setup' ===")
                            nodeCmd.logger.debug(argv)

                            nodeCmd.setup(argv).then(r => {
                                nodeCmd.logger.debug("==== Finished running `node setup`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .command({
                        command: 'start',
                        desc: 'Start a node running Hedera platform',
                        builder: yargs => {
                            yargs.option('node-ids', flags.nodeIDs)
                        },
                        handler: argv => {
                            nodeCmd.logger.debug("==== Running 'node start' ===")
                            nodeCmd.logger.debug(argv)

                            nodeCmd.start(argv).then(r => {
                                nodeCmd.logger.debug("==== Finished running `node start`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .command({
                        command: 'stop',
                        desc: 'stop a node running Hedera platform',
                        builder: yargs => {
                            yargs.option('node-ids', flags.nodeIDs)
                        },
                        handler: argv => {
                            nodeCmd.logger.debug("==== Running 'node stop' ===")
                            nodeCmd.logger.debug(argv)

                            nodeCmd.stop(argv).then(r => {
                                nodeCmd.logger.debug("==== Finished running `node stop`====")

                                if (!r) process.exit(1)
                            })

                        }
                    })
                    .demand(1, 'Select a node command')
            }
        }
    }
}


