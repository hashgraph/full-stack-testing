import * as fs from 'fs'
import { Listr } from 'listr2'
import * as path from 'path'
import { FullstackTestingError, IllegalArgumentError, MissingArgumentError } from './errors.mjs'
import { constants } from './index.mjs'
import { Templates } from './templates.mjs'

/**
 * PlatformInstaller install platform code in the root-container of a network pod
 */
export class PlatformInstaller {
  constructor (logger, kubectl) {
    if (!logger) throw new MissingArgumentError('an instance of core/Logger is required')
    if (!kubectl) throw new MissingArgumentError('an instance of core/Kubectl is required')

    this.logger = logger
    this.kubectl = kubectl
  }

  async setupHapiDirectories (podName, containerName = constants.ROOT_CONTAINER) {
    if (!podName) throw new MissingArgumentError('podName is required')

    try {
      // reset HAPI_PATH
      await this.kubectl.execContainer(podName, containerName, `rm -rf ${constants.HEDERA_SERVICES_PATH}`)

      const paths = [
        `${constants.HEDERA_HAPI_PATH}/data/keys`,
        `${constants.HEDERA_HAPI_PATH}/data/config`
      ]

      for (const p of paths) {
        await this.kubectl.execContainer(podName, containerName, `mkdir -p ${p}`)
      }

      await this.setPathPermission(podName, constants.HEDERA_SERVICES_PATH)

      return true
    } catch (e) {
      throw new FullstackTestingError(`failed to setup directories in pod '${podName}' at ${constants.HAPI_PATH}`, e)
    }
  }

  async validatePlatformReleaseDir (releaseDir) {
    if (!releaseDir) throw new MissingArgumentError('releaseDir is required')
    if (!fs.existsSync(releaseDir)) {
      throw new IllegalArgumentError('releaseDir does not exists', releaseDir)
    }

    const dataDir = `${releaseDir}/data`
    const appsDir = `${releaseDir}/${constants.HEDERA_DATA_APPS_DIR}`
    const libDir = `${releaseDir}/${constants.HEDERA_DATA_LIB_DIR}`

    if (!fs.existsSync(dataDir)) {
      throw new IllegalArgumentError('releaseDir does not have data directory', releaseDir)
    }

    if (!fs.existsSync(appsDir)) {
      throw new IllegalArgumentError(`'${constants.HEDERA_DATA_APPS_DIR}' missing in '${releaseDir}'`, releaseDir)
    }

    if (!fs.existsSync(libDir)) {
      throw new IllegalArgumentError(`'${constants.HEDERA_DATA_LIB_DIR}' missing in '${releaseDir}'`, releaseDir)
    }

    if (!fs.statSync(appsDir).isEmpty()) {
      throw new IllegalArgumentError(`'${constants.HEDERA_DATA_APPS_DIR}' is empty in releaseDir: ${releaseDir}`, releaseDir)
    }

    if (!fs.statSync(libDir).isEmpty()) {
      throw new IllegalArgumentError(`'${constants.HEDERA_DATA_LIB_DIR}' is empty in releaseDir: ${releaseDir}`, releaseDir)
    }
  }

  async copyPlatform (podName, buildZipFile) {
    if (!podName) throw new MissingArgumentError('podName is required')
    if (!buildZipFile) throw new MissingArgumentError('buildZipFile is required')
    if (!fs.statSync(buildZipFile).isFile()) throw new IllegalArgumentError('buildZipFile does not exists', buildZipFile)

    try {
      await this.kubectl.copy(
        buildZipFile,
        `${podName}:${constants.HEDERA_USER_HOME_DIR}`,
        '-c root-container'
      )

      await this.setupHapiDirectories(podName)
      await this.kubectl.execContainer(podName, constants.ROOT_CONTAINER,
        `cd ${constants.HEDERA_HAPI_PATH} && jar xvf /home/hedera/build-*`)

      return true
    } catch (e) {
      throw new FullstackTestingError(`failed to copy platform code to pod '${podName}'`, e)
    }
  }

  /**
   * Copy a list of files to a directory in the container
   *
   * @param podName pod name
   * @param srcFiles list of source files
   * @param destDir destination directory
   * @param container name of the container
   *
   * @return {Promise<string[]>} list of pathso of the copied files insider the container
   */
  async copyFiles (podName, srcFiles, destDir, container = constants.ROOT_CONTAINER) {
    try {
      const fileMap = new Map()

      // prepare the file mapping
      for (const srcPath of srcFiles) {
        const fileName = path.basename(srcPath)
        fileMap.set(srcPath, path.join(destDir, fileName))
      }

      return this.copyFileMap(podName, fileMap, container)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy files to pod '${podName}': ${e.message}`, e)
    }
  }

  /**
   * Copy a list of file into pod
   * @param podName pod name
   * @param fileMap a map containing srcPath and dstPath
   * @param container name of the container
   * @return {Promise<*[]>}
   */
  async copyFileMap (podName, fileMap, container = constants.ROOT_CONTAINER) {
    const self = this
    const copiedFiles = []
    try {
      for (const fileEntry of fileMap.entries()) {
        const srcPath = fileEntry[0]
        const dstPath = fileEntry[1]

        if (!fs.existsSync(srcPath)) {
          throw new FullstackTestingError(`file does not exist: ${srcPath}`)
        }

        self.logger.debug(`Copying files into ${podName}: ${srcPath} -> ${dstPath}`)
        await this.kubectl.copy(
          srcPath,
          `${podName}:${dstPath}`,
          `-c ${container}`
        )

        copiedFiles.push(dstPath)
      }

      return copiedFiles
    } catch (e) {
      throw new FullstackTestingError(`failed to copy files to pod '${podName}': ${e.message}`, e)
    }
  }

  async copyGossipKeys (podName, stagingDir) {
    const self = this

    if (!podName) throw new MissingArgumentError('podName is required')
    if (!stagingDir) throw new MissingArgumentError('stagingDir is required')

    try {
      const keysDir = `${constants.HEDERA_HAPI_PATH}/data/keys`
      const nodeId = Templates.extractNodeIdFromPodName(podName)
      const srcFiles = [
        `${stagingDir}/keys/${Templates.renderKeyFileName(constants.SIGNING_KEY_PREFIX, nodeId)}`,
        `${stagingDir}/keys/${Templates.renderCertFileName(constants.SIGNING_KEY_PREFIX, nodeId)}`,
        `${stagingDir}/keys/${Templates.renderKeyFileName(constants.AGREEMENT_KEY_PREFIX, nodeId)}`,
        `${stagingDir}/keys/${Templates.renderCertFileName(constants.AGREEMENT_KEY_PREFIX, nodeId)}`
      ]

      return await self.copyFiles(podName, srcFiles, keysDir)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy gossip keys to pod '${podName}': ${e.message}`, e)
    }
  }

  async copyPlatformConfigFiles (podName, stagingDir) {
    const self = this

    if (!podName) throw new MissingArgumentError('podName is required')
    if (!stagingDir) throw new MissingArgumentError('stagingDir is required')

    try {
      const srcFilesSet1 = [
        `${stagingDir}/config.txt`,
        `${stagingDir}/templates/log4j2.xml`,
        `${stagingDir}/templates/settings.txt`
      ]

      const fileList1 = await self.copyFiles(podName, srcFilesSet1, constants.HEDERA_HAPI_PATH)

      const srcFilesSet2 = [
        `${stagingDir}/templates/properties/api-permission.properties`,
        `${stagingDir}/templates/properties/application.properties`,
        `${stagingDir}/templates/properties/bootstrap.properties`
      ]

      const fileList2 = await self.copyFiles(podName, srcFilesSet2, `${constants.HEDERA_HAPI_PATH}/data/config`)

      return fileList1.concat(fileList2)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy config files to pod '${podName}'`, e)
    }
  }

  async copyTLSKeys (podName, stagingDir) {
    const self = this

    if (!podName) throw new MissingArgumentError('podName is required')
    if (!stagingDir) throw new MissingArgumentError('stagingDir is required')

    try {
      const nodeId = Templates.extractNodeIdFromPodName(podName)

      const fileMap = new Map()

      fileMap.set(
        `${stagingDir}/keys/${Templates.renderKeyFileName('hedera', nodeId)}`,
        `${constants.HEDERA_HAPI_PATH}/hedera.key`)

      fileMap.set(
        `${stagingDir}/keys/${Templates.renderCertFileName('hedera', nodeId)}`,
        `${constants.HEDERA_HAPI_PATH}/hedera.crt`)

      return await self.copyFileMap(podName, fileMap)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy TLS keys to pod '${podName}'`, e)
    }
  }

  async setPathPermission (podName, destPath, mode = '0755', recursive = true, container = constants.ROOT_CONTAINER) {
    if (!podName) throw new MissingArgumentError('podName is required')
    if (!destPath) throw new MissingArgumentError('destPath is required')

    try {
      const recursiveFlag = recursive ? '-R' : ''
      await this.kubectl.execContainer(podName, container, `chown ${recursiveFlag} hedera:hedera ${destPath}`)
      await this.kubectl.execContainer(podName, container, `chmod ${recursiveFlag} ${mode} ${destPath}`)
      return true
    } catch (e) {
      throw new FullstackTestingError(`failed to set permission in '${podName}': ${destPath}`, e)
    }
  }

  async setPlatformDirPermissions (podName) {
    const self = this
    if (!podName) throw new MissingArgumentError('podName is required')

    try {
      const destPaths = [
        constants.HEDERA_HAPI_PATH
      ]

      for (const destPath of destPaths) {
        await self.setPathPermission(podName, destPath)
      }

      return true
    } catch (e) {
      throw new FullstackTestingError(`failed to set permission in '${podName}'`, e)
    }
  }

  /**
   * Prepares config.txt file for the node
   * @param nodeIDs node IDs
   * @param destPath path where config.txt should be written
   * @param releaseTag release tag e.g. v0.42.0
   * @param template path to the confit.template file
   * @param chainId chain ID (298 for local network)
   * @returns {Promise<unknown>}
   */
  async prepareConfigTxt (nodeIDs, destPath, releaseTag, chainId = constants.HEDERA_CHAIN_ID, template = `${constants.RESOURCES_DIR}/templates/config.template`) {
    const self = this

    if (!nodeIDs || nodeIDs.length === 0) throw new MissingArgumentError('list of node IDs is required')
    if (!destPath) throw new MissingArgumentError('destPath is required')
    if (!template) throw new MissingArgumentError('config templatePath is required')
    if (!releaseTag) throw new MissingArgumentError('release tag is required')

    if (!fs.existsSync(path.dirname(destPath))) throw new IllegalArgumentError(`destPath does not exist: ${destPath}`, destPath)
    if (!fs.existsSync(template)) throw new IllegalArgumentError(`config templatePath does not exist: ${template}`, destPath)

    const accountIdPrefix = process.env.FST_NODE_ACCOUNT_ID_PREFIX || '0.0'
    const accountIdStart = process.env.FST_NODE_ACCOUNT_ID_START || '3'
    const internalPort = process.env.FST_NODE_INTERNAL_GOSSIP_PORT || '50111'
    const externalPort = process.env.FST_NODE_EXTERNAL_GOSSIP_PORT || '50111'
    const ledgerId = process.env.FST_CHAIN_ID || chainId
    const appName = process.env.FST_HEDERA_APP_NAME || constants.HEDERA_APP_JAR
    const nodeStakeAmount = process.env.FST_NODE_DEFAULT_STAKE_AMOUNT || constants.HEDERA_NODE_DEFAULT_STAKE_AMOUNT

    const releaseTagParts = releaseTag.split('.')
    if (releaseTagParts.length !== 3) throw new FullstackTestingError(`release tag must have form v<major>.<minior>.<patch>, found ${releaseTagParts}`, 'v<major>.<minor>.<patch>', releaseTag)
    const minorVersion = parseInt(releaseTagParts[1], 10)

    try {
      const configLines = []
      configLines.push(`swirld, ${ledgerId}`)
      configLines.push(`app, ${appName}`)

      let nodeSeq = 0
      let accountIdSeq = parseInt(accountIdStart, 10)
      for (const nodeId of nodeIDs) {
        const podName = Templates.renderNetworkPodName(nodeId)
        const svcName = Templates.renderNetworkSvcName(nodeId)

        const nodeName = nodeId
        const nodeNickName = nodeId

        const internalIP = await self.kubectl.getPodIP(podName)
        const externalIP = await self.kubectl.getClusterIP(svcName)

        const account = `${accountIdPrefix}.${accountIdSeq}`
        if (minorVersion >= 40) {
          configLines.push(`address, ${nodeSeq}, ${nodeNickName}, ${nodeName}, ${nodeStakeAmount}, ${internalIP}, ${internalPort}, ${externalIP}, ${externalPort}, ${account}`)
        } else {
          configLines.push(`address, ${nodeSeq}, ${nodeName}, ${nodeStakeAmount}, ${internalIP}, ${internalPort}, ${externalIP}, ${externalPort}, ${account}`)
        }

        nodeSeq += 1
        accountIdSeq += 1
      }

      if (minorVersion >= 41) {
        configLines.push(`nextNodeId, ${nodeSeq}`)
      }

      fs.writeFileSync(destPath, configLines.join('\n'))

      return configLines
    } catch (e) {
      throw new FullstackTestingError('failed to generate config.txt', e)
    }
  }

  /**
   * Return a list of task to perform node installation
   *
   * It assumes the staging directory has the following files and resources:
   *   ${staging}/keys/s-<nodeId>.key: signing key for a node
   *   ${staging}/keys/s-<nodeId>.crt: signing cert for a node
   *   ${staging}/keys/a-<nodeId>.key: agreement key for a node
   *   ${staging}/keys/a-<nodeId>.crt: agreement cert for a node
   *   ${staging}/keys/hedera-<nodeId>.key: gRPC TLS key for a node
   *   ${staging}/keys/hedera-<nodeId>.crt: gRPC TSL cert for a node
   *   ${staging}/properties: contains all properties files
   *   ${staging}/log4j2.xml: LOG4J file
   *   ${staging}/settings.txt: settings.txt file for the network
   *   ${staging}/config.txt: config.txt file for the network
   *
   * @param podName name of the pod
   * @param buildZipFile path to the platform build.zip file
   * @param stagingDir staging directory path
   * @param force force flag
   * @returns {Listr<ListrContext, ListrPrimaryRendererValue, ListrSecondaryRendererValue>}
   */
  taskInstall (podName, buildZipFile, stagingDir, force = false) {
    const self = this
    return new Listr([
      {
        title: 'Copy platform',
        task: (_, task) =>
          self.copyPlatform(podName, buildZipFile)
      },
      {
        title: 'Copy Gossip keys',
        task: (_, task) =>
          self.copyGossipKeys(podName, stagingDir)
      },
      {
        title: 'Copy TLS keys',
        task: (_, task) =>
          self.copyTLSKeys(podName, stagingDir)
      },
      {
        title: 'Copy configuration files',
        task: (_, task) =>
          self.copyPlatformConfigFiles(podName, stagingDir)
      },
      {
        title: 'Set file permissions',
        task: (_, task) =>
          self.setPlatformDirPermissions(podName)
      }
    ],
    {
      concurrent: false,
      rendererOptions: {
        collapseSubtasks: false
      }
    }
    )
  }
}
