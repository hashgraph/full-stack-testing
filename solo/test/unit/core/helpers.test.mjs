import { describe, expect, it } from '@jest/globals'
import { FullstackTestingError } from '../../../src/core/errors.mjs'
import * as helpers from '../../../src/core/helpers.mjs'

describe('Helpers', () => {
  it.each([
    ['v0.42.5', { major: 0, minor: 42, patch: 5 }],
    ['v0.42.5-alpha.0', { major: 0, minor: 42, patch: 5 }]
  ])('should parse release tag into major, minor and patch numbers', (input, expected) => {
    const result = helpers.parseReleaseTag(input)
    expect(result).toEqual(expected)
  })

  it.each([
    ['', new FullstackTestingError('invalid release tag. Expected \'v<MAJOR>.<MINOR>.<PATCH>\', found \'\'')],
    ['0.42.5', new FullstackTestingError('invalid release tag. Expected \'v<MAJOR>.<MINOR>.<PATCH>\', found \'0.42.5\'')],
    ['v0.42', new FullstackTestingError('releaseTag must have the format MAJOR.MINOR.PATCH')],
    ['v0.42', new FullstackTestingError('releaseTag must have the format MAJOR.MINOR.PATCH')],
    ['v0.NEW', new FullstackTestingError('releaseTag must have the format MAJOR.MINOR.PATCH')]
  ])('should throw error in parsing release tag', (input, expectedError) => {
    expect.assertions(1)
    try {
      helpers.parseReleaseTag(input) // Error(new FullstackTestingError('releaseTag must have the format MAJOR.MINOR.PATCH'))
    } catch (e) {
      expect(e).toEqual(expectedError)
    }
  })
})
