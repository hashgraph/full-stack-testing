import {FullstackTestingError, IllegalArgumentError, MissingArgumentError} from "./errors.mjs";
import AdmZip from 'adm-zip'
import chalk from "chalk";
import * as fs from "fs";

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

    async setupHapiDirectories(pod) {
        return new Promise((resolve, reject) => {

        })
    }

    async validatePlatformReleaseDir(releaseDir) {
        if (!releaseDir) throw new MissingArgumentError('releaseDir is required')
        if (!fs.existsSync(releaseDir)) throw new IllegalArgumentError('releaseDir does not exists', releaseDir)
        if (!fs.existsSync(`${releaseDir}/data`)) throw new IllegalArgumentError('releaseDir does not have data directory', releaseDir)
        if (!fs.existsSync(`${releaseDir}/data/apps`)) throw new IllegalArgumentError(`releaseDir '${releaseDir}' does not have data/apps directory`, releaseDir)
        if (!fs.existsSync(`${releaseDir}/data/libs`)) throw new IllegalArgumentError(`releaseDir '${releaseDir}' does not have data/libs directory`, releaseDir)
        if (!fs.statSync(`${releaseDir}/data/app`).isEmpty()) throw new IllegalArgumentError(`data/app is empty in releaseDir: ${releaseDir}`, releaseDir)
        if (!fs.statSync(`${releaseDir}/data/libs`).isEmpty()) throw new IllegalArgumentError(`data/libs is empty in releaseDir: ${releaseDir}`, releaseDir)
    }


    async copyPlatform(pod, platformPath) {
        return new Promise(async (resolve, reject) => {
            try {

                // setup directories in the root container
                await this.setupHapiDirectories(pod)

                // install all the files into the pod at appropriate location
                // "${KCTL}" cp "${PLATFORM_INSTALLER_PATH}" "${pod}":"${HEDERA_HOME_DIR}" -c root-container || return "${EX_ERR}"
            } catch (e) {
                resolve(e)
            }
        })
    }

    async copyNodeGossipKeys(releaseDir) {
        return new Promise((resolve, reject) => {

        })
    }

    async copyPlatformConfigFiles(releaseDir) {
        return new Promise((resolve, reject) => {

        })
    }

    async copyNodeTLSKeys(releaseDir) {
        return new Promise((resolve, reject) => {

        })
    }

    async unzipFile(srcPath, destPath, showStatus= false) {
        const self = this

        if (!srcPath) throw new MissingArgumentError('srcPath is required')
        if (!destPath) throw new MissingArgumentError('destPath is required')

        if (! fs.existsSync(srcPath)) throw new IllegalArgumentError('srcPath does not exists', srcPath)

        return new Promise((resolve, reject) => {
            try {
                self.logger.debug(`Unzip ${srcPath} -> ${destPath}`)
                const zip = AdmZip(srcPath, {readEntries: true})

                zip.getEntries().forEach(function (zipEntry) {
                    self.logger.debug(`Extracting file: ${zipEntry.entryName} -> ${destPath}/${zipEntry.entryName} ...`, {src: zipEntry.entryName, dst: `${destPath}/${zipEntry.entryName}`})
                    zip.extractEntryTo(zipEntry, destPath, true, true, true, zipEntry.entryName)
                    if (showStatus) {
                        self.logger.showUser(chalk.green('OK'), `Extracted: ${zipEntry.entryName} -> ${destPath}/${zipEntry.entryName}`)
                    }
                });

                resolve(destPath)
            } catch (e) {
                reject(new FullstackTestingError(`failed to unzip ${srcPath}: ${e.message}`, e))
            }
        })
    }

    async setNodeFilePermissions(srcPath, destPath) {
        const self = this

        return new Promise((resolve, reject) => {
        })
    }

    async install(pod, releaseDir) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.validatePlatformReleaseDir(releaseDir)
                await this.copyPlatform(pod, releaseDir)
                await this.copyNodeGossipKeys(pod)
                await this.copyNodeTLSKeys(pod)
                await this.copyPlatformConfigFiles(pod)
                await this.setNodeFilePermissions(pod)
                resolve(true)
            } catch (e) {
                reject(e)
            }
        })
    }
}