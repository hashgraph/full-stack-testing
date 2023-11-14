import fs from "fs";
import {FullstackTestingError, MissingArgumentError} from "./errors.mjs";
import {constants} from "./constants.mjs";
import {Logger} from "./logging.mjs"
import * as flags from "../commands/flags.mjs";
import {dirname} from "path";
import {fileURLToPath} from "url";

// cache current directory
const CUR_FILE_DIR = dirname(fileURLToPath(import.meta.url))

export class ConfigManager {
    constructor(logger) {
        if (!logger || !(logger instanceof Logger)) throw new MissingArgumentError("An instance of core/Logger is required")

        this.logger = logger
    }

    /**
     * load package.json
     * @returns {any}
     */
    loadPackageJSON() {
        try {
            let raw = fs.readFileSync(`${CUR_FILE_DIR}/../../package.json`)
            return JSON.parse(raw.toString())
        } catch (e) {
            throw new FullstackTestingError('failed to load package.json', e)
        }
    }

    hasFlag(config, flag) {
        return !!config.flags[flag.name];
    }

    flagValue(config, flag) {
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
     * @returns {Promise<unknown>}
     */
    async setupConfig(opts) {
        const self = this

        return new Promise((resolve, reject) => {
            try {
                let config = {}
                let writeConfig = false
                let packageJSON = self.loadPackageJSON()

                // if config exist, then load it first
                if (fs.existsSync(constants.FST_CONFIG_FILE)) {
                    const configJSON = fs.readFileSync(constants.FST_CONFIG_FILE)
                    config = JSON.parse(configJSON.toString())
                }

                if (!config['flags']) {
                    config['flags'] = {}
                }

                // we always use packageJSON version as the version, so overwrite.
                config.version = packageJSON.version

                // extract flags from argv

                flags.allFlags.forEach(flag => {
                    if (opts[flag.name] !== undefined) {
                        config['flags'][flag.name] = opts[flag.name]
                        writeConfig = true
                    }
                })

                // store last command that was run
                if(opts["_"]) {
                    config['lastCommand'] = opts["_"]
                }

                // store CLI config
                if (writeConfig) {
                    config.updatedAt = new Date().toISOString()

                    let configJSON = JSON.stringify(config)
                    fs.writeFileSync(`${constants.FST_CONFIG_FILE}`, configJSON)
                    configJSON = fs.readFileSync(constants.FST_CONFIG_FILE)
                    config = JSON.parse(configJSON.toString())
                }

                resolve(config)
            } catch (e) {
                reject(new FullstackTestingError(`failed to load config: ${e.message}`, e))
            }
        })
    }

}