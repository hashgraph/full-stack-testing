/**
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the ""License"");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an ""AS IS"" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import fs from 'fs'
import { FullstackTestingError, MissingArgumentError } from './errors.mjs'
import { constants } from './index.mjs'
import { Logger } from './logging.mjs'
import * as flags from '../commands/flags.mjs'
import * as paths from 'path'
import * as helpers from './helpers.mjs'

export class ConfigManager {
  constructor (logger, fstConfigFile = constants.SOLO_CONFIG_FILE, persistMode = true) {
    if (!logger || !(logger instanceof Logger)) throw new MissingArgumentError('An instance of core/Logger is required')

    if (fstConfigFile === constants.SOLO_CONFIG_FILE) {
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
    this.config = {
      flags: {},
      version: '',
      updatedAt: ''
    }
  }

  verifyConfigFile (fstConfigFile) {
    try {
      if (fs.existsSync(fstConfigFile)) {
        const configJSON = fs.readFileSync(fstConfigFile)
        JSON.parse(configJSON.toString())
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
    try {
      let writeConfig = false
      const packageJSON = helpers.loadPackageJSON()

      this.logger.debug('Start: load config', { argv, cachedConfig: this.config })

      // if config exist, then load it first
      if (!reset && fs.existsSync(this.fstConfigFile)) {
        const configJSON = fs.readFileSync(this.fstConfigFile)
        this.config = JSON.parse(configJSON.toString())
        this.logger.debug(`Loaded cached config from ${this.fstConfigFile}`, { cachedConfig: this.config })
      }

      if (!this.config.flags) {
        this.config.flags = {}
      }

      // we always use packageJSON version as the version, so overwrite.
      this.config.version = packageJSON.version

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
            switch (flag.definition.type) {
              case 'string':
                if (val) {
                  if (flag.name === flags.chartDirectory.name || flag.name === flags.cacheDir.name) {
                    this.logger.debug(`Resolving directory path for '${flag.name}': ${val}`)
                    val = paths.resolve(val)
                  }
                  this.logger.debug(`Setting flag '${flag.name}' of type '${flag.definition.type}': ${val}`)
                  this.config.flags[flag.name] = val
                  writeConfig = true
                }
                break

              case 'number':
              case 'boolean':
                this.logger.debug(`Setting flag '${flag.name}' of type '${flag.definition.type}': ${val}`)
                this.config.flags[flag.name] = val
                writeConfig = true
                break

              default:
                throw new FullstackTestingError(`Unsupported field type for flag '${flag.name}': ${flag.definition.type}`)
            }
          }
        }

        // store last command that was run
        if (argv._) {
          this.config.lastCommand = argv._
        }
      }

      // store CLI config
      if (reset || writeConfig) {
        this.persist()
      }

      this.logger.debug('Finish: load config', { argv, cachedConfig: this.config })

      // set dev mode for logger if necessary
      this.logger.setDevMode(this.getFlag(flags.devMode))

      return this.config
    } catch (e) {
      throw new FullstackTestingError(`failed to load config: ${e.message}`, e)
    }
  }

  /**
   * Check if a flag value is set
   * @param flag flag object
   * @return {boolean}
   */
  hasFlag (flag) {
    return this.config.flags[flag.name] !== undefined
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
