import {DataValidationError, FullstackTestingError, IllegalArgumentError, MissingArgumentError} from "./errors.mjs";
import chalk from "chalk";
import * as fs from "fs";
import {constants} from "./constants.mjs";
import {Templates} from "./templates.mjs";
import * as path from "path";

/**
 * PlatformInstaller install platform code in the root-container of a network pod
 */
export class PlatformInstaller {

    constructor(logger, kubectl) {
        if (!logger) throw new MissingArgumentError("an instance of core/Logger is required")
        if (!kubectl) throw new MissingArgumentError("an instance of core/Kubectl is required")

        this.logger = logger
        this.kubectl = kubectl
    }

    async setupHapiDirectories(podName, containerName = constants.ROOT_CONTAINER) {
        const self = this

        if (!podName) throw new MissingArgumentError('podName is required')
        return new Promise(async (resolve, reject) => {
            try {
                // reset HAPI_PATH
                await this.kubectl.execContainer(podName, containerName, `rm -rf ${constants.HGCAPP_SERVICES_HEDERA_PATH}`)

                const paths = [
                    `${constants.HAPI_PATH}/data/keys`,
                    `${constants.HAPI_PATH}/data/config`,
                ]

                for (const p of paths) {
                    await this.kubectl.execContainer(podName, containerName, `mkdir -p ${p}`)
                }

                await this.setPathPermission(podName, constants.HGCAPP_SERVICES_HEDERA_PATH)

                resolve(true)
            } catch (e) {
                reject(new FullstackTestingError(`failed to setup directories in pod '${podName}' at ${constants.HAPI_PATH}`, e))
            }
        })
    }

    async validatePlatformReleaseDir(releaseDir) {
        if (!releaseDir) throw new MissingArgumentError('releaseDir is required')
        if (!fs.existsSync(releaseDir)) {
            throw new IllegalArgumentError('releaseDir does not exists', releaseDir)
        }

        const dataDir = `${releaseDir}/data`
        const appsDir = `${releaseDir}/${constants.DATA_APPS_DIR}`
        const libDir = `${releaseDir}/${constants.DATA_LIB_DIR}`

        if (!fs.existsSync(dataDir)) {
            throw new IllegalArgumentError('releaseDir does not have data directory', releaseDir)
        }

        if (!fs.existsSync(appsDir)) {
            throw new IllegalArgumentError(`'${constants.DATA_APPS_DIR}' missing in '${releaseDir}'`, releaseDir)
        }

        if (!fs.existsSync(libDir)) {
            throw new IllegalArgumentError(`'${constants.DATA_LIB_DIR}' missing in '${releaseDir}'`, releaseDir)
        }

        if (!fs.statSync(`${releaseDir}/data/apps`).isEmpty()) {
            throw new IllegalArgumentError(`'${constants.DATA_APPS_DIR}' is empty in releaseDir: ${releaseDir}`, releaseDir)
        }

        if (!fs.statSync(`${releaseDir}/data/lib`).isEmpty()) {
            throw new IllegalArgumentError(`'${constants.DATA_LIB_DIR}' is empty in releaseDir: ${releaseDir}`, releaseDir)
        }
    }

    async copyPlatform(podName, buildZipFile) {
        const self = this
        if (!podName) throw new MissingArgumentError('podName is required')
        if (!buildZipFile) throw new MissingArgumentError('buildZipFile is required')
        if (!fs.statSync(buildZipFile).isFile()) throw new IllegalArgumentError('buildZipFile does not exists', buildZipFile)

        return new Promise(async (resolve, reject) => {
            try {
                await this.kubectl.copy(podName,
                    buildZipFile,
                    `${podName}:${constants.HEDERA_USER_HOME_DIR}`,
                    '-c root-container',
                )

                await this.setupHapiDirectories(podName)
                await this.kubectl.execContainer(podName, constants.ROOT_CONTAINER,
                    `cd ${constants.HAPI_PATH} && jar xvf /home/hedera/build-*`)

                resolve(true)
            } catch (e) {
                resolve(new FullstackTestingError('failed to copy platform code into pods', e))
            }
        })
    }

    async copyFiles(podName, srcFiles, destDir, container = constants.ROOT_CONTAINER) {
        const self = this
        return new Promise(async (resolve, reject) => {
            try {
                for (const srcPath of srcFiles) {
                    self.logger.debug(`Copying files into ${podName}: ${srcPath} -> ${destDir}`)
                    await this.kubectl.copy(podName,
                        srcPath,
                        `${podName}:${destDir}`,
                        `-c ${container}`,
                    )
                }

                const fileList = await this.kubectl.execContainer(podName, container, `ls ${destDir}`)

                // create full path
                const fullPaths = []
                fileList.forEach(filePath => fullPaths.push(`${destDir}/${filePath}`))

                resolve(fullPaths)
            } catch (e) {
                reject(new FullstackTestingError(`failed to copy files to pod '${podName}'`, e))
            }
        })
    }

    async copyGossipKeys(podName, stagingDir) {
        const self = this

        if (!podName) throw new MissingArgumentError('podName is required')
        if (!stagingDir) throw new MissingArgumentError('stagingDir is required')

        return new Promise(async (resolve, reject) => {
            try {
                const keysDir = `${constants.HAPI_PATH}/data/keys`
                const nodeId = Templates.extractNodeIdFromPodName(podName)
                const srcFiles = [
                    `${stagingDir}/templates/node-keys/private-${nodeId}.pfx`,
                    `${stagingDir}/templates/node-keys/public.pfx`,
                ]

                resolve(await self.copyFiles(podName, srcFiles, keysDir))
            } catch (e) {
                reject(new FullstackTestingError(`failed to copy gossip keys to pod '${podName}'`, e))
            }
        })
    }

    async copyPlatformConfigFiles(podName, stagingDir) {
        const self = this

        if (!podName) throw new MissingArgumentError('podName is required')
        if (!stagingDir) throw new MissingArgumentError('stagingDir is required')

        return new Promise(async (resolve, reject) => {
            try {
                const srcFilesSet1 = [
                    `${stagingDir}/config.txt`,
                    `${stagingDir}/templates/log4j2.xml`,
                    `${stagingDir}/templates/settings.txt`,
                ]

                const fileList1 = await self.copyFiles(podName, srcFilesSet1, constants.HAPI_PATH)

                const srcFilesSet2 = [
                    `${stagingDir}/templates/properties/api-permission.properties`,
                    `${stagingDir}/templates/properties/application.properties`,
                    `${stagingDir}/templates/properties/bootstrap.properties`,
                ]

                const fileList2 = await self.copyFiles(podName, srcFilesSet2, `${constants.HAPI_PATH}/data/config`)

                resolve(fileList1.concat(fileList2))
            } catch (e) {
                reject(new FullstackTestingError(`failed to copy config files to pod '${podName}'`, e))
            }
        })
    }

    async copyTLSKeys(podName, stagingDir) {
        const self = this

        if (!podName) throw new MissingArgumentError('podName is required')
        if (!stagingDir) throw new MissingArgumentError('stagingDir is required')

        return new Promise(async (resolve, reject) => {
            try {
                const destDir = constants.HAPI_PATH
                const srcFiles = [
                    `${stagingDir}/templates/hedera.key`,
                    `${stagingDir}/templates/hedera.crt`,
                ]

                resolve(await self.copyFiles(podName, srcFiles, destDir))
            } catch (e) {
                reject(new FullstackTestingError(`failed to copy TLS keys to pod '${podName}'`, e))
            }
        })
    }

    async setPathPermission(podName, destPath, mode = '0755', recursive = true, container = constants.ROOT_CONTAINER) {
        const self = this
        if (!podName) throw new MissingArgumentError('podName is required')
        if (!destPath) throw new MissingArgumentError('destPath is required')

        return new Promise(async (resolve, reject) => {
            try {
                const recursiveFlag = recursive ? '-R' : ''
                await this.kubectl.execContainer(podName, container, `chown ${recursiveFlag} hedera:hedera ${destPath}`)
                await this.kubectl.execContainer(podName, container, `chmod ${recursiveFlag} ${mode} ${destPath}`)
                resolve(true)
            } catch (e) {
                reject(new FullstackTestingError(`failed to set permission in '${podName}': ${destPath}`, e))
            }
        })
    }

    async setPlatformDirPermissions(podName) {
        const self = this
        if (!podName) throw new MissingArgumentError('podName is required')

        return new Promise(async (resolve, reject) => {
            try {
                const destPaths = [
                    constants.HAPI_PATH
                ]

                for (const destPath of destPaths) {
                    await self.setPathPermission(podName, destPath)
                }

                resolve(true)
            } catch (e) {
                reject(new FullstackTestingError(`failed to set permission in '${podName}': ${destPath}`, e))
            }
        })
    }

    /**
     * Prepares config.txt file for the node
     * @param nodeIDs node IDs
     * @param destPath path where config.txt should be written
     * @param releaseTag release tag e.g. v0.42.0
     * @param template path to the confit.template file
     * @returns {Promise<unknown>}
     */
    async prepareConfigTxt(nodeIDs, destPath, releaseTag, template = `${constants.RESOURCES_DIR}/templates/config.template`) {
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
        const ledgerName = process.env.FST_LEDGER_NAME || constants.CLUSTER_NAME
        const appName = process.env.FST_HEDERA_APP_NAME || constants.HEDERA_APP_JAR
        const nodeStakeAmount = process.env.FST_NODE_DEFAULT_STAKE_AMOUNT || constants.HEDERA_NODE_DEFAULT_STAKE_AMOUNT

        const releaseTagParts = releaseTag.split(".")
        if (releaseTagParts.length !== 3) throw new FullstackTestingError(`release tag must have form v<major>.<minior>.<patch>, found ${releaseTagParts}`, 'v<major>.<minor>.<patch>', releaseTag)
        const minorVersion = parseInt(releaseTagParts[1], 10)


        return new Promise(async (resolve, reject) => {
            try {
                const configLines = []
                configLines.push(`swirld, ${ledgerName}`)
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

                fs.writeFileSync(destPath, configLines.join("\n"))

                resolve(configLines)
            } catch (e) {
                reject(new FullstackTestingError('failed to generate config.txt', e))
            }

        })
    }

    async prepareStaging(nodeIDs, stagingDir, releaseTag, force = false) {
        const self = this
        return new Promise(async (resolve, reject) => {
            try {
                if (!fs.existsSync(stagingDir)) {
                    fs.mkdirSync(stagingDir, {recursive: true})
                }

                const configTxtPath = `${stagingDir}/config.txt`

                // copy a templates from fsnetman resources directory
                fs.cpSync(`${constants.RESOURCES_DIR}/templates/`, `${stagingDir}/templates`, {recursive: true})

                // prepare address book
                await this.prepareConfigTxt(nodeIDs, configTxtPath, releaseTag, `${stagingDir}/templates/config.template`)
                self.logger.showUser(chalk.green('OK'), `Prepared config.txt: ${configTxtPath}`)

                resolve(true)
            } catch (e) {
                reject(new FullstackTestingError('failed to preparing staging area', e))
            }
        })
    }

    async install(podName, buildZipFile, stagingDir, force = false, homeDir = constants.FST_HOME_DIR) {
        const self = this
        return new Promise(async (resolve, reject) => {
            try {
                self.logger.showUser(constants.LOG_GROUP_DIVIDER)
                self.logger.showUser(chalk.cyan(`Installing platform to ${podName}`))

                self.logger.showUser(constants.LOG_STATUS_PROGRESS, `[POD=${podName}] Copying platform: ${buildZipFile} ...`)
                await this.copyPlatform(podName, buildZipFile)
                self.logger.showUser(constants.LOG_STATUS_DONE, `[POD=${podName}] Copied platform into network-node: ${buildZipFile}`)

                self.logger.showUser(constants.LOG_STATUS_PROGRESS, `[POD=${podName}] Copying gossip keys ...`)
                await this.copyGossipKeys(podName, stagingDir)
                self.logger.showUser(constants.LOG_STATUS_DONE, `[POD=${podName}] Copied gossip keys`)

                self.logger.showUser(constants.LOG_STATUS_PROGRESS, `[POD=${podName}] Copying TLS keys ...`)
                await this.copyTLSKeys(podName, stagingDir)
                self.logger.showUser(constants.LOG_STATUS_DONE, `[POD=${podName}] Copied TLS keys`)

                self.logger.showUser(constants.LOG_STATUS_PROGRESS, `[POD=${podName}] Copying auxiliary config files ...`)
                await this.copyPlatformConfigFiles(podName, stagingDir)
                self.logger.showUser(constants.LOG_STATUS_DONE, `[POD=${podName}] Copied auxiliary config keys`)

                self.logger.showUser(constants.LOG_STATUS_PROGRESS, `[POD=${podName}] Setting file permissions ...`)
                await this.setPlatformDirPermissions(podName)
                self.logger.showUser(constants.LOG_STATUS_DONE, `[POD=${podName}] Set file permissions`)

                resolve(true)
            } catch (e) {
                self.logger.showUserError(e)
                reject(e)
            }
        })
    }
}