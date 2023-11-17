import { describe, expect, it } from '@jest/globals'
import {
  FullstackTestingError,
  ResourceNotFoundError,
  MissingArgumentError,
  IllegalArgumentError,
  DataValidationError
} from '../../../src/core/errors.mjs'

describe('Errors', () => {
  const message = 'errorMessage'
  const cause = 'cause'

  it('should construct correct FullstackTestingError', () => {
    const error = new FullstackTestingError(message, cause)
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('FullstackTestingError')
    expect(error.message).toBe(message)
    expect(error.cause).toBe(cause)
    expect(error.meta).toStrictEqual({})
  })

  it('should construct correct ResourceNotFoundError', () => {
    const resource = 'resource'
    const error = new ResourceNotFoundError(message, resource)
    expect(error).toBeInstanceOf(FullstackTestingError)
    expect(error.name).toBe('ResourceNotFoundError')
    expect(error.message).toBe(message)
    expect(error.cause).toStrictEqual({})
    expect(error.meta).toStrictEqual({ resource })
  })

  it('should construct correct MissingArgumentError', () => {
    const error = new MissingArgumentError(message)
    expect(error).toBeInstanceOf(FullstackTestingError)
    expect(error.name).toBe('MissingArgumentError')
    expect(error.message).toBe(message)
    expect(error.cause).toStrictEqual({})
    expect(error.meta).toStrictEqual({})
  })

  it('should construct correct IllegalArgumentError', () => {
    const value = 'invalid argument'
    const error = new IllegalArgumentError(message, value)
    expect(error).toBeInstanceOf(FullstackTestingError)
    expect(error.name).toBe('IllegalArgumentError')
    expect(error.message).toBe(message)
    expect(error.cause).toStrictEqual({})
    expect(error.meta).toStrictEqual({ value })
  })

  it('should construct correct DataValidationError', () => {
    const expected = 'expected'
    const found = 'found'
    const error = new DataValidationError(message, expected, found)
    expect(error).toBeInstanceOf(FullstackTestingError)
    expect(error.name).toBe('DataValidationError')
    expect(error.message).toBe(message)
    expect(error.cause).toStrictEqual({})
    expect(error.meta).toStrictEqual({ expected, found })
  })
})
