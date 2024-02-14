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
import { beforeAll, describe, expect, it } from '@jest/globals'
import {
  ChartManager,
  ConfigManager,
  constants, DependencyManager,
  Helm,
  K8
} from '../../../src/core/index.mjs'
import { getTestCacheDir, testLogger } from '../../test_util.js'
import path from 'path'
import { AccountManager } from '../../../src/core/account_manager.mjs'
import { AccountCommand } from '../../../src/commands/account.mjs'
import { flags } from '../../../src/commands/index.mjs'
import { HEDERA_NODE_ACCOUNT_ID_START } from '../../../src/core/constants.mjs'

describe('account commands should work correctly', () => {
  let accountCmd
  let accountManager
  let configManager
  let k8
  let helm
  let chartManager
  let depManager
  const argv = {}

  beforeAll(() => {
    configManager = new ConfigManager(testLogger, path.join(getTestCacheDir('accountCmd'), 'solo.config'))
    k8 = new K8(configManager, testLogger)
    accountManager = new AccountManager(testLogger, k8, constants)
    helm = new Helm(testLogger)
    chartManager = new ChartManager(helm, testLogger)
    depManager = new DependencyManager(testLogger)
    accountCmd = new AccountCommand({
      logger: testLogger,
      helm,
      k8,
      chartManager,
      configManager,
      depManager,
      accountManager
    })

    argv[flags.cacheDir.name] = getTestCacheDir('accountCmd')
    argv[flags.namespace.name] = 'solo-e2e'
    argv[flags.clusterName.name] = 'kind-solo-e2e'
    argv[flags.clusterSetupNamespace.name] = 'solo-e2e-cluster'
    configManager.update(argv, true)
  })

  it('account create with no options', async () => {
    await expect(accountCmd.create(argv)).resolves.toBeTruthy()

    const accountInfo = accountCmd.ctx.accountInfo
    expect(accountInfo).not.toBeNull()
    expect(accountInfo.accountId).not.toBeNull()
    expect(accountInfo.privateKey).not.toBeNull()
    expect(accountInfo.publicKey).not.toBeNull()
    expect(accountInfo.amount).toEqual(flags.amount.definition.defaultValue)
  })

  it('account create with private key, amount, and stdout options', () => {

  })

  it('account update with account and amount options', () => {

  })

  it('account update with account, new private key, and standard out options', () => {

  })

  it('account get with account option', async () => {
    argv[flags.accountId.name] = `${HEDERA_NODE_ACCOUNT_ID_START.realm}.${HEDERA_NODE_ACCOUNT_ID_START.shard}.1001`
    await expect(accountCmd.get(argv)).resolves.toBeTruthy()
  })

  it('account get with account id and private key options', () => {

  })
})
