import { FullstackTestingError, IllegalArgumentError, MissingArgumentError } from './errors.mjs'
import fs from 'fs'
import AdmZip from 'adm-zip'
import chalk from 'chalk'
import path from 'path'

export class Zippy {
  constructor (logger) {
    if (!logger) throw new Error('An instance of core/Logger is required')
    this.logger = logger
  }

  /**
     * Zip a file or directory
     * @param srcPath path to a file or directory
     * @param destPath path to the output zip file
     * @returns {Promise<unknown>}
     */
  async zip (srcPath, destPath, verbose = false) {
    const self = this

    if (!srcPath) throw new MissingArgumentError('srcPath is required')
    if (!destPath) throw new MissingArgumentError('destPath is required')
    if (!destPath.endsWith('.zip')) throw new MissingArgumentError('destPath must be a path to a zip file')

    return new Promise(async (resolve, reject) => {
      try {
        const zip = AdmZip('', {})

        const stat = fs.statSync(srcPath)
        if (stat.isDirectory()) {
          zip.addLocalFolder(srcPath, '')
        } else {
          zip.addFile(path.basename(srcPath), fs.readFileSync(srcPath), '', stat)
        }

        await zip.writeZipPromise(destPath, { overwrite: true })

        resolve(destPath)
      } catch (e) {
        reject(new FullstackTestingError(`failed to unzip ${srcPath}: ${e.message}`, e))
      }
    })
  }

  async unzip (srcPath, destPath, verbose = false) {
    const self = this

    if (!srcPath) throw new MissingArgumentError('srcPath is required')
    if (!destPath) throw new MissingArgumentError('destPath is required')

    if (!fs.existsSync(srcPath)) throw new IllegalArgumentError('srcPath does not exists', srcPath)

    return new Promise((resolve, reject) => {
      try {
        const zip = AdmZip(srcPath, { readEntries: true })

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
        })

        resolve(destPath)
      } catch (e) {
        reject(new FullstackTestingError(`failed to unzip ${srcPath}: ${e.message}`, e))
      }
    })
  }
}
