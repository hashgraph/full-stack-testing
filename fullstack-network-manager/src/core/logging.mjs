import * as winston from 'winston'
import {constants} from "./constants.mjs";
import {v4 as uuidv4} from 'uuid';
import * as util from "util";
import chalk from "chalk";

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
        const self = this
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
                new winston.transports.File({filename: `${constants.FST_LOGS_DIR}/fst.log`}),
                // new winston.transports.File({filename: constants.TMP_DIR + "/logs/error.log", level: 'error'}),
                // new winston.transports.Console({format: customFormat})
            ],
        });
    }

    nextTraceId() {
        this.traceId = uuidv4()
    }

    prepMeta(meta) {
        if (meta === undefined) {
            meta = {}
        }

        meta.traceId = this.traceId
        return meta
    }

    showUser(msg, ...args) {
        console.log(util.format(msg, ...args))
    }

    showUserError(err) {
        this.error(err.message, err)

        console.log(chalk.red('ERROR: '))
        console.log(err.stack)

        if (err.cause) {
            console.log(chalk.red('Caused by: '))
            let depth = 0
            let cause = err.cause
            while (cause !== undefined && depth < 10) {
                if (cause.stack) {
                    console.log(cause.stack)
                }

                cause = cause.cause
                depth += 1
            }
        }
    }

    critical(msg, ...args) {
        this.winsonLogger.crit(msg, ...args, this.prepMeta())
    }

    error(msg, ...args) {
        this.winsonLogger.error(msg, ...args, this.prepMeta())
    }

    warn(msg, ...args) {
        this.winsonLogger.warn(msg, ...args, this.prepMeta())
    }

    notice(msg, ...args) {
        this.winsonLogger.notice(msg, ...args, this.prepMeta())
    }

    info(msg, ...args) {
        this.winsonLogger.info(msg, ...args, this.prepMeta())
    }

    debug(msg, ...args) {
        this.winsonLogger.debug(msg, ...args, this.prepMeta())
    }

    showList(itemType, items = []) {
        this.showUser(chalk.green(`\n *** List of ${itemType} ***`))
        this.showUser(chalk.green(`---------------------------------------`))
        if (items.length > 0) {
            items.forEach(name => this.showUser(chalk.yellow(` - ${name}`)))
        } else {
            this.showUser(chalk.blue(`[ None ]`))
        }

        this.showUser("\n")
        return true
    }
}

export function NewLogger(level = 'debug') {
    return new Logger(level)
}
