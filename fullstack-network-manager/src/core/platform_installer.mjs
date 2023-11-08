import {IllegalArgumentError, MissingArgumentError} from "./errors.mjs";
import chalk from "chalk";
import * as fs from "fs";
import * as core from "./constants.mjs";

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

    async setupHapiDirectories(podName, containerName = core.constants.ROOT_CONTAINER) {
        const self = this

        if (!podName) throw new MissingArgumentError('podName is required')
        return new Promise(async (resolve, reject) => {
            try {
                const paths = [
                    core.constants.HAPI_PATH,
                    `${core.constants.HAPI_PATH}/data/keys`,
                    `${core.constants.HAPI_PATH}/data/config`,
                ]

                for (const p of paths) {
                    await this.kubectl.execContainer(podName, containerName, `mkdir -p ${p}`)
                }

                resolve(true)
            } catch (e) {
                reject(e)
            }
        })
    }

    async validatePlatformReleaseDir(releaseDir) {
        if (!releaseDir) throw new MissingArgumentError('releaseDir is required')
        if (!fs.existsSync(releaseDir)) {
            throw new IllegalArgumentError('releaseDir does not exists', releaseDir)
        }

        const dataDir = `${releaseDir}/data`
        const appsDir = `${releaseDir}/${core.constants.DATA_APPS_DIR}`
        const libDir = `${releaseDir}/${core.constants.DATA_LIB_DIR}`

        if (!fs.existsSync(dataDir)) {
            throw new IllegalArgumentError('releaseDir does not have data directory', releaseDir)
        }

        if (!fs.existsSync(appsDir)) {
            throw new IllegalArgumentError(`'${core.constants.DATA_APPS_DIR}' missing in '${releaseDir}'`, releaseDir)
        }

        if (!fs.existsSync(libDir)) {
            throw new IllegalArgumentError(`'${core.constants.DATA_LIB_DIR}' missing in '${releaseDir}'`, releaseDir)
        }

        if (!fs.statSync(`${releaseDir}/data/apps`).isEmpty()) {
            throw new IllegalArgumentError(`'${core.constants.DATA_APPS_DIR}' is empty in releaseDir: ${releaseDir}`, releaseDir)
        }

        if (!fs.statSync(`${releaseDir}/data/lib`).isEmpty()) {
            throw new IllegalArgumentError(`'${core.constants.DATA_LIB_DIR}' is empty in releaseDir: ${releaseDir}`, releaseDir)
        }
    }

    async copyPlatform(podName, buildZipFile) {
        const self = this
        if (!podName) throw new MissingArgumentError('podName is required')
        if (!buildZipFile) throw new MissingArgumentError('buildZipFile is required')
        if(!fs.statSync(buildZipFile).isFile()) throw new IllegalArgumentError('buildZipFile does not exists', buildZipFile)

        return new Promise(async (resolve, reject) => {
            try {
                self.logger.showUser(chalk.cyan('>>'), `[POD=${podName}] Copying platform: ${buildZipFile} ...`)
                await this.kubectl.copy(podName,
                    buildZipFile,
                    `${podName}:${core.constants.HEDERA_HOME_DIR}`,
                    '-c root-container',
                )

                await this.setupHapiDirectories(podName)
                await this.kubectl.execContainer(podName, core.constants.ROOT_CONTAINER,
                    `cd ${core.constants.HAPI_PATH} && jar xvf /home/hedera/build-*`)

                self.logger.showUser(chalk.green('OK'), `[POD=${podName}] Copied platform into network-node: ${buildZipFile}`)
                resolve(true)
            } catch (e) {
                resolve(e)
            }
        })
    }

    async copyGossipKeys(releaseDir) {
        return new Promise((resolve, reject) => {

        })
    }

    async copyPlatformConfigFiles(releaseDir) {
        return new Promise((resolve, reject) => {

        })
    }

    async copyTLSKeys(releaseDir) {
        return new Promise((resolve, reject) => {

        })
    }

    async setFilePermissions(srcPath, destPath) {
        const self = this

        return new Promise((resolve, reject) => {
        })
    }

    async prepareStaging(stagingDir, buildZipFile, force = false) {
        return new Promise(async (resolve, reject) => {
            try {
               resolve(true)
            } catch (e) {
                reject(e)
            }
        })
    }

    async install(pod, buildZipFile, force = false) {
        const self = this
        return new Promise(async (resolve, reject) => {
            try {
                // this is where all the temporary keys and configs are stored
                const stagingDir = `${core.constants.FST_HOME_DIR}/staging`
                await this.prepareStaging(stagingDir, buildZipFile, force)
                await this.copyPlatform(pod, buildZipFile)
                // await this.copyGossipKeys(pod, stagingDir)
                // await this.copyTLSKeys(pod, stagingDir)
                // await this.copyPlatformConfigFiles(pod, stagingDir)
                // await this.setFilePermissions(pod)
                resolve(true)
            } catch (e) {
                self.logger.showUserError(e)
                reject(e)
            }
        })
    }
}