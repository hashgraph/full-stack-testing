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
const config = {
  moduleFileExtensions: ['js', 'mjs'],
  verbose: true,
  testSequencer: './test/e2e/jestCustomSequencer.cjs',
  projects: [
    {
      rootDir: '<rootDir>/test/e2e',
      displayName: 'end-to-end',
      testMatch: ['<rootDir>/**/*.test.mjs']
    },
    {
      rootDir: '<rootDir>/test/unit',
      displayName: 'unit',
      testMatch: ['<rootDir>/**/*.test.mjs']
    }
  ]
}
export default config
