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
  constructor(logger, k8) {
    if (!logger) throw new MissingArgumentError('an instance of core/Logger is required')
    if (!k8) throw new MissingArgumentError('an instance of core/K8 is required')

    this.logger = logger
    this.k8 = k8
  }

  async setupHapiDirectories(podName, containerName = constants.ROOT_CONTAINER) {
    if (!podName) throw new MissingArgumentError('podName is required')

    try {
      // reset HAPI_PATH
      await this.k8.execContainer(podName, containerName, `rm -rf ${constants.HEDERA_SERVICES_PATH}`)

      const paths = [
        `${constants.HEDERA_HAPI_PATH}/data/keys`,
        `${constants.HEDERA_HAPI_PATH}/data/config`
      ]

      for (const p of paths) {
        await this.k8.execContainer(podName, containerName, `mkdir -p ${p}`)
      }

      await this.setPathPermission(podName, constants.HEDERA_SERVICES_PATH)

      return true
    } catch (e) {
      throw new FullstackTestingError(`failed to setup directories in pod '${podName}' at ${constants.HAPI_PATH}`, e)
    }
  }

  async validatePlatformReleaseDir(releaseDir) {
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

  async copyPlatform(podName, buildZipSrc) {
    if (!podName) throw new MissingArgumentError('podName is required')
    if (!buildZipSrc) throw new MissingArgumentError('buildZipSrc is required')
    if (!fs.statSync(buildZipSrc).isFile()) throw new IllegalArgumentError('buildZipFile does not exists', buildZipSrc)

    try {
      await this.copyFiles(podName, [buildZipSrc], constants.HEDERA_USER_HOME_DIR)
      return this.extractPlatform(podName, buildZipSrc)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy platform code in to pod '${podName}': ${e.message}`, e)
    }
  }

  async extractPlatform(podName, buildZipSrc) {
    if (!podName) throw new MissingArgumentError('podName is required')
    if (!buildZipSrc) throw new MissingArgumentError('buildZipSrc is required')

    const buildZipFileName = path.basename(buildZipSrc)
    const buildZip = path.join(constants.HEDERA_USER_HOME_DIR, buildZipFileName) // inside the container
    const extractScriptName = 'extract-jar.sh'
    const extractScriptSrc = path.join(constants.RESOURCES_DIR, extractScriptName)
    const extractScript = path.join(constants.HEDERA_USER_HOME_DIR, extractScriptName) // inside the container

    this.logger.debug(`Extracting platform code in pod ${podName}`, {
      extractScript,
      buildZip,
      dest: constants.HEDERA_HAPI_PATH
    })

    try {
      await this.copyFiles(podName, [extractScriptSrc], constants.HEDERA_USER_HOME_DIR)
      await this.k8.execContainer(podName, constants.ROOT_CONTAINER, `chmod +x ${extractScript}`)
      await this.setupHapiDirectories(podName)
      await this.k8.execContainer(podName, constants.ROOT_CONTAINER,
        [extractScript, buildZip, constants.HEDERA_HAPI_PATH])

      return true
    } catch (e) {
      throw new FullstackTestingError(`failed to extract platform code in this pod '${podName}': ${e.message}`, e)
    }
  }

  async copyFiles(podName, srcFiles, destDir, container = constants.ROOT_CONTAINER) {
    const self = this
    try {
      for (const srcPath of srcFiles) {
        self.logger.debug(`Copying file into ${podName}: ${srcPath} -> ${destDir}`)
        await this.k8.copyTo(podName, container, srcPath, destDir)
      }

      const fileList = await this.k8.execContainer(podName, container, `ls ${destDir}`)

      // create full path
      if (fileList) {
        const fullPaths = []
        fileList.split('\n').forEach(filePath => {
          if (filePath) {
            fullPaths.push(`${destDir}/${filePath}`)
          }
        })
        return fullPaths
      }
      throw new FullstackTestingError(`could not receive file list after copy; ${fileList}`)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy files to pod '${podName}'`, e)
    }
  }

  async copyGossipKeys(podName, stagingDir) {
    const self = this

    if (!podName) throw new MissingArgumentError('podName is required')
    if (!stagingDir) throw new MissingArgumentError('stagingDir is required')

    try {
      const keysDir = `${constants.HEDERA_HAPI_PATH}/data/keys`
      const nodeId = Templates.extractNodeIdFromPodName(podName)
      const srcFiles = [
        `${stagingDir}/templates/node-keys/private-${nodeId}.pfx`,
        `${stagingDir}/templates/node-keys/public.pfx`
      ]

      return await self.copyFiles(podName, srcFiles, keysDir)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy gossip keys to pod '${podName}'`, e)
    }
  }

  async copyPlatformConfigFiles(podName, stagingDir) {
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

  async copyTLSKeys(podName, stagingDir) {
    const self = this

    if (!podName) throw new MissingArgumentError('podName is required')
    if (!stagingDir) throw new MissingArgumentError('stagingDir is required')

    try {
      const destDir = constants.HEDERA_HAPI_PATH
      const srcFiles = [
        `${stagingDir}/templates/hedera.key`,
        `${stagingDir}/templates/hedera.crt`
      ]

      return await self.copyFiles(podName, srcFiles, destDir)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy TLS keys to pod '${podName}'`, e)
    }
  }

  async setPathPermission(podName, destPath, mode = '0755', recursive = true, container = constants.ROOT_CONTAINER) {
    if (!podName) throw new MissingArgumentError('podName is required')
    if (!destPath) throw new MissingArgumentError('destPath is required')

    try {
      const recursiveFlag = recursive ? '-R' : ''
      await this.k8.execContainer(podName, container, `chown ${recursiveFlag} hedera:hedera ${destPath}`)
      await this.k8.execContainer(podName, container, `chmod ${recursiveFlag} ${mode} ${destPath}`)
      return true
    } catch (e) {
      throw new FullstackTestingError(`failed to set permission in '${podName}': ${destPath}`, e)
    }
  }

  async setPlatformDirPermissions(podName) {
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
  async prepareConfigTxt(nodeIDs, destPath, releaseTag, chainId = constants.HEDERA_CHAIN_ID, template = `${constants.RESOURCES_DIR}/templates/config.template`) {
    const self = this

    if (!nodeIDs || nodeIDs.length === 0) throw new MissingArgumentError('list of node IDs is required')
    if (!destPath) throw new MissingArgumentError('destPath is required')
    if (!template) throw new MissingArgumentError('config templatePath is required')
    if (!releaseTag) throw new MissingArgumentError('release tag is required')

    if (!fs.existsSync(path.dirname(destPath))) throw new IllegalArgumentError(`destPath does not exist: ${destPath}`, destPath)
    if (!fs.existsSync(template)) throw new IllegalArgumentError(`config templatePath does not exist: ${template}`, destPath)

    // init variables
    const startAccountId = constants.HEDERA_NODE_ACCOUNT_ID_START
    const accountIdPrefix = `${startAccountId.realm}.${startAccountId.shard}`
    const internalPort = constants.HEDERA_NODE_INTERNAL_GOSSIP_PORT
    const externalPort = constants.HEDERA_NODE_EXTERNAL_GOSSIP_PORT
    const appName = constants.HEDERA_APP_NAME
    const nodeStakeAmount = constants.HEDERA_NODE_DEFAULT_STAKE_AMOUNT

    const releaseTagParts = releaseTag.split('.')
    if (releaseTagParts.length !== 3) throw new FullstackTestingError(`release tag must have form v<major>.<minior>.<patch>, found ${releaseTagParts}`, 'v<major>.<minor>.<patch>', releaseTag)
    const minorVersion = parseInt(releaseTagParts[1], 10)

    try {
      const configLines = []
      configLines.push(`swirld, ${chainId}`)
      configLines.push(`app, ${appName}`)

      let nodeSeq = 0
      let accountIdSeq = parseInt(startAccountId.num.toString(), 10)
      for (const nodeId of nodeIDs) {
        const podName = Templates.renderNetworkPodName(nodeId)
        const svcName = Templates.renderNetworkSvcName(nodeId)

        const nodeName = nodeId
        const nodeNickName = nodeId

        const internalIP = await self.k8.getPodIP(podName)
        const externalIP = await self.k8.getClusterIP(svcName)

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
   * Return a lit of task to prepare the staging directory
   * @param nodeIDs list of node IDs
   * @param stagingDir full path to the staging directory
   * @param releaseTag release version
   * @param force force flag
   * @param chainId chain ID
   * @returns {Listr<ListrContext, ListrPrimaryRendererValue, ListrSecondaryRendererValue>}
   */
  taskPrepareStaging(nodeIDs, stagingDir, releaseTag, force = false, chainId = constants.HEDERA_CHAIN_ID) {
    const self = this
    const configTxtPath = `${stagingDir}/config.txt`

    return new Listr([
      {
        title: 'Copy templates',
        task: () => {
          if (!fs.existsSync(stagingDir)) {
            fs.mkdirSync(stagingDir, { recursive: true })
          }

          fs.cpSync(`${constants.RESOURCES_DIR}/templates/`, `${stagingDir}/templates`, { recursive: true })
        }
      },
      {
        title: 'Prepare config.txt',
        task: () => self.prepareConfigTxt(nodeIDs, configTxtPath, releaseTag, chainId, `${stagingDir}/templates/config.template`)
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

  /**
   * Return a list of task to perform node installation
   * @param podName name of the pod
   * @param buildZipFile path to the platform build.zip file
   * @param stagingDir staging directory path
   * @param force force flag
   * @returns {Listr<ListrContext, ListrPrimaryRendererValue, ListrSecondaryRendererValue>}
   */
  taskInstall(podName, buildZipFile, stagingDir, force = false) {
    const self = this
    return new Listr([
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
