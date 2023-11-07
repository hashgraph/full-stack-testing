import {IllegalArgumentError, MissingArgumentError} from "./errors.mjs";

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
        return new Promise((resolve, reject) => {

        })
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

    async unzipFile(srcPath, destPath) {
        const self = this

        return new Promise((resolve, reject) => {

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