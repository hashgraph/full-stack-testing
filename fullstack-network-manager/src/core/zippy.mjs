import {FullstackTestingError, IllegalArgumentError, MissingArgumentError} from "./errors.mjs";
import fs from "fs";
import AdmZip from "adm-zip";
import chalk from "chalk";

export class Zippy {
    constructor(logger) {
        if (!logger ) throw new Error("An instance of core/Logger is required")
        this.logger = logger
    }

    async unzip(srcPath, destPath, verbose = false) {
        const self = this

        if (!srcPath) throw new MissingArgumentError('srcPath is required')
        if (!destPath) throw new MissingArgumentError('destPath is required')

        if (!fs.existsSync(srcPath)) throw new IllegalArgumentError('srcPath does not exists', srcPath)

        return new Promise((resolve, reject) => {
            try {
                const zip = AdmZip(srcPath, {readEntries: true})

                zip.getEntries().forEach(function (zipEntry) {
                    if (verbose) {
                        self.logger.debug(`Extracting file: ${zipEntry.entryName} -> ${destPath}/${zipEntry.entryName} ...`, {
                            src: zipEntry.entryName,
                            dst: `${destPath}/${zipEntry.entryName}`
                        })
                    }

                    zip.extractEntryTo(zipEntry, destPath, true, true, true, zipEntry.entryName)
                    if (verbose) {
                        self.logger.showUser(chalk.green('OK'), `Extracted: ${zipEntry.entryName} -> ${destPath}/${zipEntry.entryName}`)
                    }
                });

                resolve(destPath)
            } catch (e) {
                reject(new FullstackTestingError(`failed to unzip ${srcPath}: ${e.message}`, e))
            }
        })
    }
}
