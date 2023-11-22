import { BaseCommand } from './base.mjs'
import * as flags from './flags.mjs'
import {
  FullstackTestingError,
  IllegalArgumentError,
  MissingArgumentError
} from '../core/errors.mjs'
import { constants, Templates } from '../core/index.mjs'
import chalk from 'chalk'
import * as fs from 'fs'

/**
 * Defines the core functionalities of 'node' command
 */
export class NodeCommand extends BaseCommand {
  constructor (opts) {
    super(opts)

    if (!opts || !opts.downloader) throw new IllegalArgumentError('An instance of core/PackageDowner is required', opts.downloader)
    if (!opts || !opts.platformInstaller) throw new IllegalArgumentError('An instance of core/PlatformInstaller is required', opts.platformInstaller)

    this.downloader = opts.downloader
    this.plaformInstaller = opts.platformInstaller
  }

  /**
     * Check if pods are running or not
     * @param namespace
     * @param nodeIds
     * @param timeout
     * @returns {Promise<unknown>}
     */
  async checkNetworkNodePods (namespace, nodeIds = [], timeout = '300s') {
    try {
      const podNames = []
      if (nodeIds && nodeIds.length > 0) {
        for (let nodeId of nodeIds) {
          nodeId = nodeId.trim()
          const podName = Templates.renderNetworkPodName(nodeId)

          await this.kubectl.wait('pod',
            '--for=jsonpath=\'{.status.phase}\'=Running',
            '-l fullstack.hedera.com/type=network-node',
                        `-l fullstack.hedera.com/node-name=${nodeId}`,
                        `--timeout=${timeout}`,
                        `-n "${namespace}"`
          )

          podNames.push(podName)
        }
      } else {
        nodeIds = []
        const output = await this.kubectl.get('pods',
          '-l fullstack.hedera.com/type=network-node',
          '--no-headers',
          '-o custom-columns=":metadata.name"',
                    `-n "${namespace}"`
        )
        output.forEach(podName => {
          nodeIds.push(Templates.extractNodeIdFromPodName(podName))
          podNames.push(podName)
        })
      }

      return { podNames, nodeIDs: nodeIds }
    } catch (e) {
      throw new FullstackTestingError(`Error on detecting pods for nodes (${nodeIds}): ${e.message}`)
    }
  }

  async setup (argv) {
    const self = this
    if (!argv.releaseTag && !argv.releaseDir) throw new MissingArgumentError('release-tag or release-dir argument is required')

    const namespace = argv.namespace
    const force = argv.force
    const releaseTag = argv.releaseTag
    const releaseDir = argv.releaseDir

    try {
      self.logger.showUser(constants.LOG_GROUP_DIVIDER)

      const releasePrefix = Templates.prepareReleasePrefix(releaseTag)
      let buildZipFile = `${releaseDir}/${releasePrefix}/build-${releaseTag}.zip`
      const stagingDir = `${releaseDir}/${releasePrefix}/staging/${releaseTag}`
      const nodeIDsArg = argv.nodeIds ? argv.nodeIds.split(',') : []

      fs.mkdirSync(stagingDir, { recursive: true })

      // pre-check
      const { podNames, nodeIDs } = await this.checkNetworkNodePods(namespace, nodeIDsArg)

      // fetch platform build-<tag>.zip file
      if (force || !fs.existsSync(buildZipFile)) {
        self.logger.showUser(chalk.cyan('>>'), `Fetching Platform package 'build-${releaseTag}.zip' from '${constants.HEDERA_BUILDS_URL}' ...`)
        buildZipFile = await this.downloader.fetchPlatform(releaseTag, releaseDir)
      } else {
        self.logger.showUser(chalk.cyan('>>'), `Found Platform package in cache: build-${releaseTag}.zip`)
      }
      self.logger.showUser(chalk.green('OK'), `Platform package: ${buildZipFile}`)

      // prepare staging
      await this.plaformInstaller.prepareStaging(nodeIDs, stagingDir, releaseTag, force)

      // setup
      for (const podName of podNames) {
        await self.plaformInstaller.install(podName, buildZipFile, stagingDir, force)
      }

      return true
    } catch (e) {
      self.logger.showUserError(e)
    }

    return false
  }

  async start (argv) {
    const self = this

    try {
      const namespace = argv.namespace
      const nodeIDsArg = argv.nodeIds ? argv.nodeIds.split(',') : []
      const { podNames } = await this.checkNetworkNodePods(namespace, nodeIDsArg)
      for (const podName of podNames) {
        self.logger.showUser(chalk.cyan('>>'), `Starting node ${podName}`)
        await self.kubectl.execContainer(podName, constants.ROOT_CONTAINER, 'systemctl restart network-node')
        self.logger.showUser(chalk.green('OK'), `Started node ${podName}`)
      }

      return true
    } catch (e) {
      self.logger.showUserError(e)
    }

    return false
  }

  async stop (argv) {
    const self = this

    try {
      const namespace = argv.namespace
      const nodeIDsArg = argv.nodeIds ? argv.nodeIds.split(',') : []
      const { podNames } = await this.checkNetworkNodePods(namespace, nodeIDsArg)
      for (const podName of podNames) {
        self.logger.showUser(chalk.cyan('>>'), `Stopping node ${podName}`)
        await self.kubectl.execContainer(podName, constants.ROOT_CONTAINER, 'systemctl restart network-node')
        self.logger.showUser(chalk.green('OK'), `Stopped node ${podName}`)
      }

      return true
    } catch (e) {
      self.logger.showUserError(e)
    }

    return false
  }

  /**
     * Return Yargs command definition for 'node' command
     * @param nodeCmd an instance of NodeCommand
     */
  static getCommandDefinition (nodeCmd) {
    return {
      command: 'node',
      desc: 'Manage a FST node running Hedera platform',
      builder: yargs => {
        return yargs
          .command({
            command: 'setup',
            desc: 'Setup node with a specific version of Hedera platform',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.nodeIDs,
              flags.releaseTag,
              flags.platformReleaseDir,
              flags.force,
              flags.chainId
            ),
            handler: argv => {
              nodeCmd.logger.debug("==== Running 'node setup' ===")
              nodeCmd.logger.debug(argv)

              nodeCmd.setup(argv).then(r => {
                nodeCmd.logger.debug('==== Finished running `node setup`====')

                if (!r) process.exit(1)
              })
            }
          })
          .command({
            command: 'start',
            desc: 'Start a node running Hedera platform',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.nodeIDs
            ),
            handler: argv => {
              console.log('here')
              nodeCmd.logger.showUser('here2')
              nodeCmd.logger.debug("==== Running 'node start' ===")
              nodeCmd.logger.debug(argv)

              nodeCmd.start(argv).then(r => {
                nodeCmd.logger.debug('==== Finished running `node start`====')

                if (!r) process.exit(1)
              })
            }
          })
          .command({
            command: 'stop',
            desc: 'stop a node running Hedera platform',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.nodeIDs
            ),
            handler: argv => {
              nodeCmd.logger.debug("==== Running 'node stop' ===")
              nodeCmd.logger.debug(argv)

              nodeCmd.stop(argv).then(r => {
                nodeCmd.logger.debug('==== Finished running `node stop`====')

                if (!r) process.exit(1)
              })
            }
          })
          .demandCommand(1, 'Select a node command')
      }
    }
  }
}
