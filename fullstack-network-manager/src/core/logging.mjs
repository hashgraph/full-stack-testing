import * as winston from 'winston'
import {constants} from "./constants.mjs";
import { v4 as uuidv4 } from 'uuid';
import * as util from "util";

const customFormat = winston.format.combine(
    winston.format.label({label: 'FST', message: false}),

    winston.format.splat(),

    // include timestamp in logs
    winston.format.timestamp(),

    winston.format.ms(),

    // add label metadata
    winston.format.label({label: ''}),

    // convert levels to upper case
    winston.format(data => {
        data.level = data.level.toUpperCase();
        return data
    })(),

    // use custom format TIMESTAMP [LABEL] LEVEL: MESSAGE
    winston.format.printf(data => {
        return `${data.timestamp}|${data.level}| ${data.message}`;
    }),

    // Ignore log messages if they have { private: true }
    winston.format((data, opts) => {
        if (data.private) {
            return false;
        }
        return data;
    })(),
)

const Logger = class {
    /**
     * Create a new logger
     * @param level logging level as supported by winston library:
     * {
     *   emerg: 0,
     *   alert: 1,
     *   crit: 2,
     *   error: 3,
     *   warning: 4,
     *   notice: 5,
     *   info: 6,
     *   debug: 7
     * }
     * @constructor
     */
    constructor(level) {
        let self = this
        this.nextTraceId()

        this.winsonLogger = winston.createLogger({
            level: level,
            format: winston.format.combine(
                customFormat,
                winston.format.json(),
            ),
            // format: winston.format.json(),
            // defaultMeta: { service: 'user-service' },
            transports: [
                //
                // - Write all logs with importance level of `error` or less to `error.log`
                // - Write all logs with importance level of `info` or less to `fst.log`
                //
                new winston.transports.File({filename: `${constants.FST_HOME_DIR}/logs/fst.log`}),
                // new winston.transports.File({filename: constants.TMP_DIR + "/logs/error.log", level: 'error'}),
                // new winston.transports.Console({format: customFormat})
            ],
        });
    }

    nextTraceId() {
        this.traceId = uuidv4()
    }

    enrichMeta(meta) {
        if (meta === undefined) {
            meta = {}
        }

        meta.traceId = this.traceId
        return meta
    }

    showUser(msg, ...args) {
        console.log(util.format(msg, ...args))
    }

    critical(msg, ...meta) {
        this.winsonLogger.crit(msg, this.enrichMeta(meta))
    }

    error(msg, ...meta) {
        this.winsonLogger.error(msg, this.enrichMeta(meta))
    }

    warn(msg, ...meta) {
        this.winsonLogger.warn(msg, this.enrichMeta(meta))
    }

    notice(msg, ...meta) {
        this.winsonLogger.notice(msg, this.enrichMeta(meta))
    }

    info(msg, ...meta) {
        this.winsonLogger.info(msg, this.enrichMeta(meta))
    }

    debug(msg, ...meta) {
        this.winsonLogger.debug(msg, this.enrichMeta(meta))
    }
}

export function NewLogger(level = 'debug')  {
    return new Logger(level)
}
