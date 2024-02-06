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
