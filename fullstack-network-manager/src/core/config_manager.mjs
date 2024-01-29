import fs from 'fs'
import { FullstackTestingError, MissingArgumentError } from './errors.mjs'
import { constants } from './index.mjs'
import { Logger } from './logging.mjs'
import * as flags from '../commands/flags.mjs'
import * as paths from 'path'
import { fileURLToPath } from 'url'

// cache current directory
const CUR_FILE_DIR = paths.dirname(fileURLToPath(import.meta.url))

export class ConfigManager {
  constructor (logger, fstConfigFile = constants.FST_CONFIG_FILE, persistMode = true) {
    if (!logger || !(logger instanceof Logger)) throw new MissingArgumentError('An instance of core/Logger is required')

    if (fstConfigFile === constants.FST_CONFIG_FILE) {
      this.fstConfigFile = fstConfigFile
    } else {
      if (this.verifyConfigFile(fstConfigFile)) {
        this.fstConfigFile = fstConfigFile
      } else {
        throw new FullstackTestingError(`Invalid config file: ${fstConfigFile}`)
      }
    }

    this.persistMode = persistMode === true

    this.logger = logger
    this.config = this.load()
  }

  verifyConfigFile (fstConfigFile) {
    try {
      if (fs.existsSync(fstConfigFile)) {
        const configJSON = fs.readFileSync(fstConfigFile)
        JSON.parse(configJSON.toString())
      } else {
        this.persist()
      }
      return true
    } catch (e) {
      return false
    }
  }

  persist () {
    this.config.updatedAt = new Date().toISOString()
    if (this.persistMode) {
      let configJSON = JSON.stringify(this.config)
      fs.writeFileSync(`${this.fstConfigFile}`, configJSON)
      configJSON = fs.readFileSync(this.fstConfigFile)
      this.config = JSON.parse(configJSON.toString())
    }
  }

  /**
   * Load and cache config on disk
   *
   * It overwrites previous config values using argv and store in the cached config file if any value has been changed.
   *
   * @param argv object containing various config related fields (e.g. argv)
   * @param reset if we should reset old values
   * @param flagList list of flags to be processed
   * @returns {*} config object
   */
  load (argv = {}, reset = false, flagList = flags.allFlags) {
    const self = this

    try {
      let config = {}
      let writeConfig = false
      const packageJSON = self.loadPackageJSON()

      // if config exist, then load it first
      if (!reset && fs.existsSync(this.fstConfigFile)) {
        const configJSON = fs.readFileSync(this.fstConfigFile)
        config = JSON.parse(configJSON.toString())
      }

      if (!config.flags) {
        config.flags = {}
      }

      // we always use packageJSON version as the version, so overwrite.
      config.version = packageJSON.version

      // extract flags from argv
      if (argv && Object.keys(argv).length > 0) {
        for (const flag of flagList) {
          if (flag.name === flags.force.name) {
            continue // we don't want to cache force flag
          }

          if (argv[flag.name] === '' &&
                [flags.namespace.name, flags.clusterName.name, flags.chartDirectory.name].includes(flag.name)) {
            continue // don't cache empty namespace, clusterName, or chartDirectory
          }

          if (argv[flag.name] !== undefined) {
            let val = argv[flag.name]
            if (val && flag.name === flags.chartDirectory.name) {
              val = paths.resolve(val)
            }

            if (val === undefined) {
              if (config.flags[flag.name] !== undefined) {
                config.flags[flag.name] = ''
              }
            } else {
              config.flags[flag.name] = val
            }
            writeConfig = true
          }
        }

        // store last command that was run
        if (argv._) {
          config.lastCommand = argv._
        }
      }

      // store CLI config
      this.config = config
      if (reset || writeConfig) {
        this.persist()
      }

      this.logger.debug('Setup cached config', { cachedConfig: config })

      // set dev mode for logger if necessary
      this.logger.setDevMode(this.getFlag(flags.devMode))

      return this.config
    } catch (e) {
      throw new FullstackTestingError(`failed to load config: ${e.message}`, e)
    }
  }

  /**
   * load package.json
   * @returns {any}
   */
  loadPackageJSON () {
    try {
      const raw = fs.readFileSync(`${CUR_FILE_DIR}/../../package.json`)
      return JSON.parse(raw.toString())
    } catch (e) {
      throw new FullstackTestingError('failed to load package.json', e)
    }
  }

  /**
   * Return the value of the given flag
   *
   * @param flag flag object
   * @return {*|string} value of the flag or undefined if flag value is not available
   */
  getFlag (flag) {
    if (this.config.flags[flag.name] !== undefined) {
      return this.config.flags[flag.name]
    }

    return undefined
  }

  /**
   * Set value for the flag
   * @param flag flag object
   * @param value value of the flag
   */

  setFlag (flag, value) {
    if (!flag || !flag.name) throw new MissingArgumentError('flag must have a name')
    this.config.flags[flag.name] = value
  }

  /**
   * Get package version
   * @return {*}
   */
  getVersion () {
    return this.config.version
  }

  /**
   * Get last updated at timestamp
   * @return {string}
   */
  getUpdatedAt () {
    return this.config.updatedAt
  }

  /**
   * Get last command
   * @return {*}
   */
  getLastCommand () {
    return this.config.lastCommand
  }
}
