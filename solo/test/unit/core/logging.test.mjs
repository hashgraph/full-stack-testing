import { describe, expect, it, jest } from '@jest/globals'
import { NewLogger, Logger } from '../../../src/core/logging.mjs'
import winston from 'winston'

describe('Logging', () => {
  it('should log at correct severity', () => {
    const loggerSpy = jest.spyOn(winston.Logger.prototype, 'log').mockImplementation()
    const logger = NewLogger('debug')
    expect(logger).toBeInstanceOf(Logger)
    expect(logger).toBeDefined()
    const meta = logger.prepMeta()

    logger.error('Error log')
    expect(loggerSpy).toHaveBeenCalledWith('error', 'Error log', meta)

    logger.warn('Warn log')
    expect(loggerSpy).toHaveBeenCalledWith('warn', 'Warn log', meta)

    logger.info('Info log')
    expect(loggerSpy).toHaveBeenCalledWith('info', 'Info log', meta)

    logger.debug('Debug log')
    expect(loggerSpy).toHaveBeenCalledWith('debug', 'Debug log', meta)

    jest.clearAllMocks()
  })
})
