import * as crypto from 'crypto'
import * as fs from "fs";
import {pipeline as streamPipeline} from 'node:stream/promises';
import got from 'got';
import {DataValidationError, FullstackTestingError, IllegalArgumentError, ResourceNotFoundError} from "./errors.mjs";
import * as https from "https";

export class PackageDownloader {
    /**
     * Create an instance of Downloader
     * @param logger an instance of core/Logger
     */
    constructor(logger) {
        if (!logger) throw new IllegalArgumentError("an instance of core/Logger is required", logger)
        this.logger = logger
    }

    isValidURL(url) {
        try {
            // attempt to parse to check URL format
            new URL(url);
            return true
        } catch (e) {
        }

        return false
    }

    async urlExists(url) {
        const self = this

        return new Promise((resolve, reject) => {
            try {
                self.logger.debug(`Checking URL: ${url}`)
                // attempt to send a HEAD request to check URL exists
                const req = https.request(url, {method: 'HEAD', timeout: 100, headers: {"Connection": 'close'}})

                req.on('response', r => {
                    self.logger.debug(r.headers)
                    if (r.statusCode === 200) {
                        return resolve(true)
                    }

                    resolve(false)
                })

                req.on('error', err => {
                    self.logger.error(err)
                    resolve(false)
                })

                req.end() // make the request
            } catch (e) {
                self.logger.error(e)
                resolve(false)
            }
        })
    }

    /**
     * Fetch data from a URL and save the output to a file
     *
     * @param url source file URL
     * @param destPath destination path for the downloaded file
     */
    async fetchFile(url, destPath) {
        if (!url) throw new IllegalArgumentError('source file URL is required', url)
        if (!destPath) throw new IllegalArgumentError('destination path is required', destPath)
        if (!this.isValidURL(url)) {
            throw new IllegalArgumentError(`source URL is invalid`, url)
        }

        return new Promise(async (resolve, reject) => {
            if (!await this.urlExists(url)) {
                reject(new ResourceNotFoundError(`source URL does not exist`, url))
            }

            try {
                await streamPipeline(
                    got.stream(url),
                    fs.createWriteStream(destPath)
                )
                resolve(destPath)
            } catch (e) {
                reject(new ResourceNotFoundError(`failed to download file: ${url}`, url, {url, destPath}))
            }
        })
    }

    /**
     * Compute hash of the file contents
     * @param filePath path of the file
     * @param algo hash algorithm
     * @returns {Promise<string>} returns hex digest of the computed hash
     * @throws Error if the file cannot be read
     */
    async computeFileHash(filePath, algo = 'sha384') {
        return new Promise((resolve, reject) => {
            try {
                const checksum = crypto.createHash(algo);
                const s = fs.createReadStream(filePath)
                s.on('data', function (d) {
                    checksum.update(d);
                });
                s.on('end', function () {
                    const d = checksum.digest('hex');
                    resolve(d)
                })
            } catch (e) {
                reject(new FullstackTestingError('failed to compute file hash', e, {filePath, algo}))
            }
        })
    }

    /**
     * Verifies that the checksum of the sourceFile matches with the contents of the checksumFile
     *
     * It throws error if the checksum doesn't match.
     *
     * @param sourceFile path to the file for which checksum to be computed
     * @param checksum expected checksum
     * @param algo hash algorithm to be used to compute checksum
     * @throws DataValidationError if the checksum doesn't match
     */
    async verifyChecksum(sourceFile, checksum, algo = 'sha384') {
        const computed = await this.computeFileHash(sourceFile, algo)
        if (checksum !== computed) throw new DataValidationError('checksum', checksum, computed)
    }

    /**
     * Fetch platform release artifact
     *
     * It fetches the build.zip file containing the release from a URL like: https://builds.hedera.com/node/software/v0.40/build-v0.40.4.zip
     *
     * @param tag full semantic version e.g. v0.40.4
     * @param destDir directory where the artifact needs to be saved
     * @returns {Promise<string>} full path to the downloaded file
     */
    async fetchPlatform(tag, destDir) {
        const parsed = tag.split('.')
        if (parsed.length < 3) throw new Error(`tag (${tag}) must include major, minor and patch fields (e.g. v0.40.4)`)
        if (!destDir) throw new Error('destination directory path is required')

        return new Promise(async (resolve, reject) => {
            try {
                const releaseDir = `${parsed[0]}.${parsed[1]}`
                const packageURL = `https://builds.hedera.com/node/software/${releaseDir}/build-${tag}.zip`
                const packagePath = `${destDir}/build-${tag}.zip`
                const checksumURL = `https://builds.hedera.com/node/software/${releaseDir}/build-${tag}.sha384`
                const checksumPath = `${destDir}/build-${tag}.sha384`

                await this.fetchFile(packageURL, packagePath)
                await this.fetchFile(checksumURL, checksumPath)

                const checksum = fs.readFileSync(checksumPath).toString().split(" ")[0]
                await this.verifyChecksum(packagePath, checksum)
                resolve(packagePath)
            } catch (e) {
                reject(new FullstackTestingError(`failed to fetch platform artifacts: ${e.message}`, e, {tag, destDir}))
            }
        })
    }
}
