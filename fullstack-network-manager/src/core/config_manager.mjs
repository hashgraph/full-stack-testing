import fs from 'fs'
import { FullstackTestingError, MissingArgumentError } from './errors.mjs'
import { constants } from './constants.mjs'
import { Logger } from './logging.mjs'
import * as flags from '../commands/flags.mjs'
import * as paths from 'path'
import { fileURLToPath } from 'url'

// cache current directory
const CUR_FILE_DIR = paths.dirname(fileURLToPath(import.meta.url))

export class ConfigManager {
  constructor (logger) {
    if (!logger || !(logger instanceof Logger)) throw new MissingArgumentError('An instance of core/Logger is required')

    this.logger = logger
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

  hasFlag (config, flag) {
    return !!config.flags[flag.name]
  }

  flagValue (config, flag) {
    if (this.hasFlag(config, flag)) {
      return config.flags[flag.name]
    }

    return ''
  }

  /**
   * Load and store config
   *
   * It overwrites previous config values using opts and store in the config file if any value has been changed.
   *
   * @param opts object containing various config related fields (e.g. argv)
   * @param reset if we should reset old values
   * @returns {Promise<unknown>}
   */
  async setupConfig (opts, reset = false) {
    const self = this

    try {
      let config = {}
      let writeConfig = false
      const packageJSON = self.loadPackageJSON()

      // if config exist, then load it first
      if (!reset && fs.existsSync(constants.FST_CONFIG_FILE)) {
        const configJSON = fs.readFileSync(constants.FST_CONFIG_FILE)
        config = JSON.parse(configJSON.toString())
      }

      if (!config.flags) {
        config.flags = {}
      }

      // we always use packageJSON version as the version, so overwrite.
      config.version = packageJSON.version

      // extract flags from argv
      if (opts) {
        flags.allFlags.forEach(flag => {
          if (opts && opts[flag.name]) {
            let val = opts[flag.name]
            if (val && flag.name === flags.chartDirectory.name) {
              console.log(val)
              val = paths.resolve(val)
            }

            config.flags[flag.name] = val
            writeConfig = true
          }
        })

        // store last command that was run
        if (opts._) {
          config.lastCommand = opts._
        }
      }

      // store CLI config
      if (reset || writeConfig) {
        config.updatedAt = new Date().toISOString()

        let configJSON = JSON.stringify(config)
        fs.writeFileSync(`${constants.FST_CONFIG_FILE}`, configJSON)
        configJSON = fs.readFileSync(constants.FST_CONFIG_FILE)
        config = JSON.parse(configJSON.toString())
      }

      return config
    } catch (e) {
      throw new FullstackTestingError(`failed to load config: ${e.message}`, e)
    }
  }
}
