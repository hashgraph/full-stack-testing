import * as winston from 'winston'

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

export function NewLogger(level = 'debug')  {
    let logger = winston.createLogger({
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
            // - Write all logs with importance level of `info` or less to `combined.log`
            //
            new winston.transports.File({filename: 'combined.log'}),
            new winston.transports.File({filename: 'error.log', level: 'error'}),
        ],
    });

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston.transports.Console({
            format: customFormat,
        }));
    }

    return logger
}