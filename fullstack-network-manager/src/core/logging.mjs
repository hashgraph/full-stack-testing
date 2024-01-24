import * as winston from 'winston'
import { constants } from './index.mjs'
import { v4 as uuidv4 } from 'uuid'
import * as util from 'util'
import chalk from 'chalk'

const customFormat = winston.format.combine(
  winston.format.label({ label: 'FST', message: false }),

  winston.format.splat(),

  // include timestamp in logs
  winston.format.timestamp(),

  winston.format.ms(),

  // add label metadata
  winston.format.label({ label: '' }),

  // convert levels to upper case
  winston.format(data => {
    data.level = data.level.toUpperCase()
    return data
  })(),

  // use custom format TIMESTAMP [LABEL] LEVEL: MESSAGE
  winston.format.printf(data => {
    return `${data.timestamp}|${data.level}| ${data.message}`
  }),

  // Ignore log messages if they have { private: true }
  winston.format((data, opts) => {
    if (data.private) {
      return false
    }
    return data
  })()
)

export const Logger = class {
  /**
   * Create a new logger
   * @param level logging level as supported by winston library:
   * @constructor
   */
  constructor (level = 'debug', devMode = false) {
    this.nextTraceId()
    this.devMode = devMode

    this.winstonLogger = winston.createLogger({
      level,
      format: winston.format.combine(
        customFormat,
        winston.format.json()
      ),
      // format: winston.format.json(),
      // defaultMeta: { service: 'user-service' },
      transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `fst.log`
        //
        new winston.transports.File({ filename: `${constants.FST_LOGS_DIR}/fst.log` })
        // new winston.transports.File({filename: constants.TMP_DIR + "/logs/error.log", level: 'error'}),
        // new winston.transports.Console({format: customFormat})
      ]
    })
  }

  setDevMode (devMode) {
    this.debug(`setting dev mode: ${devMode}`)
    this.devMode = devMode
  }

  setLevel (level) {
    this.winstonLogger.setLevel(level)
  }

  nextTraceId () {
    this.traceId = uuidv4()
  }

  prepMeta (meta) {
    if (meta === undefined) {
      meta = {}
    }

    meta.traceId = this.traceId
    return meta
  }

  showUser (msg, ...args) {
    console.log(util.format(msg, ...args))
  }

  showUserError (err) {
    const stack = [{ message: err.message, stacktrace: err.stack }]
    if (err.cause) {
      let depth = 0
      let cause = err.cause
      while (cause !== undefined && depth < 10) {
        if (cause.stack) {
          stack.push({ message: cause.message, stacktrace: cause.stack })
        }

        cause = cause.cause
        depth += 1
      }
    }

    if (this.devMode) {
      console.log(stack)
    } else {
      console.log(chalk.red('ERROR'), chalk.yellow(err.message))
    }

    this.error(err.message, { error: err.message, stacktrace: stack })
  }

  error (msg, ...args) {
    this.winstonLogger.error(msg, ...args, this.prepMeta())
  }

  warn (msg, ...args) {
    this.winstonLogger.warn(msg, ...args, this.prepMeta())
  }

  info (msg, ...args) {
    this.winstonLogger.info(msg, ...args, this.prepMeta())
  }

  debug (msg, ...args) {
    this.winstonLogger.debug(msg, ...args, this.prepMeta())
  }

  showList (title, items = []) {
    this.showUser(chalk.green(`\n *** ${title} ***`))
    this.showUser(chalk.green('-------------------------------------------------------------------------------'))
    if (items.length > 0) {
      items.forEach(name => this.showUser(chalk.cyan(` - ${name}`)))
    } else {
      this.showUser(chalk.blue('[ None ]'))
    }

    this.showUser('\n')
    return true
  }

  showJSON (title, obj) {
    this.showUser(chalk.green(`\n *** ${title} ***`))
    this.showUser(chalk.green('-------------------------------------------------------------------------------'))
    console.log(JSON.stringify(obj, null, ' '))
  }
}

export function NewLogger (level = 'debug', devMode = false) {
  return new Logger(level, devMode)
}
