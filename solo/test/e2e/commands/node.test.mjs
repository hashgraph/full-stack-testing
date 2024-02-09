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
import {
  AccountBalanceQuery,
  AccountCreateTransaction,
  Hbar,
  PrivateKey
} from '@hashgraph/sdk'
import { afterEach, beforeAll, describe, expect, it } from '@jest/globals'
import path from 'path'
import { namespace } from '../../../src/commands/flags.mjs'
import { flags } from '../../../src/commands/index.mjs'
import { NodeCommand } from '../../../src/commands/node.mjs'
import {
  ChartManager,
  ConfigManager,
  Helm,
  K8,
  PackageDownloader,
  PlatformInstaller,
  constants,
  DependencyManager,
  KeyManager
} from '../../../src/core/index.mjs'
import { ShellRunner } from '../../../src/core/shell_runner.mjs'
import { getTestCacheDir, testLogger } from '../../test_util.js'
import { AccountManager } from '../../../src/core/account_manager.mjs'

class TestHelper {
  static async getNodeClient (accountManager, argv) {
    const operator = await accountManager.getAccountKeysFromSecret(constants.OPERATOR_ID, argv[namespace])
    if (!operator) {
      throw new Error(`account key not found for operator ${constants.OPERATOR_ID} during getNodeClient()\n` +
    'this implies that node start did not finish the accountManager.prepareAccounts successfully')
    }
    const serviceMap = await accountManager.getNodeServiceMap(argv[namespace])
    return await accountManager.getNodeClient(argv[namespace], serviceMap, operator.accountId, operator.privateKey)
  }
}

describe.each([
  ['v0.42.5', constants.KEY_FORMAT_PFX]
  // ['v0.47.0-alpha.0', constants.KEY_FORMAT_PFX],
  // ['v0.47.0-alpha.0', constants.KEY_FORMAT_PEM]
])('NodeCommand', (testRelease, testKeyFormat) => {
  const helm = new Helm(testLogger)
  const chartManager = new ChartManager(helm, testLogger)
  const configManager = new ConfigManager(testLogger)
  const packageDownloader = new PackageDownloader(testLogger)
  const depManager = new DependencyManager(testLogger)
  const k8 = new K8(configManager, testLogger)
  const platformInstaller = new PlatformInstaller(testLogger, k8)
  const keyManager = new KeyManager(testLogger)
  const accountManager = new AccountManager(testLogger, k8, constants)

  const nodeCmd = new NodeCommand({
    logger: testLogger,
    helm,
    k8,
    chartManager,
    configManager,
    downloader: packageDownloader,
    platformInstaller,
    depManager,
    keyManager,
    accountManager
  })

  const cacheDir = getTestCacheDir()

  afterEach(() => {
    accountManager.stopPortForwards().then().catch()
  })

  describe(`node start should succeed [release ${testRelease}, keyFormat: ${testKeyFormat}]`, () => {
    const argv = {}
    argv[flags.releaseTag.name] = testRelease
    argv[flags.keyFormat.name] = testKeyFormat
    argv[flags.nodeIDs.name] = 'node0,node1,node2'
    argv[flags.cacheDir.name] = cacheDir
    argv[flags.force.name] = false
    argv[flags.chainId.name] = constants.HEDERA_CHAIN_ID
    argv[flags.chainId.name] = constants.HEDERA_CHAIN_ID
    argv[flags.generateGossipKeys.name] = false
    argv[flags.generateTlsKeys.name] = true
    argv[flags.applicationProperties.name] = flags.applicationProperties.definition.defaultValue
    argv[flags.apiPermissionProperties.name] = flags.apiPermissionProperties.definition.defaultValue
    argv[flags.bootstrapProperties.name] = flags.bootstrapProperties.definition.defaultValue
    argv[flags.settingTxt.name] = flags.settingTxt.definition.defaultValue
    argv[flags.log4j2Xml.name] = flags.log4j2Xml.definition.defaultValue

    const nodeIds = argv[flags.nodeIDs.name].split(',')

    beforeAll(() => {
      configManager.load()
      argv[namespace] = configManager.getFlag(flags.namespace)
    })

    it('should pre-generate keys', async () => {
      if (argv[flags.keyFormat.name] === constants.KEY_FORMAT_PFX) {
        const shellRunner = new ShellRunner(testLogger)
        await shellRunner.run(`test/scripts/gen-legacy-keys.sh ${nodeIds.join(',')} ${path.join(cacheDir, 'keys')}`)
      }
    }, 60000)
    it('node setup should succeed', async () => {
      expect.assertions(1)
      try {
        await expect(nodeCmd.setup(argv)).resolves.toBeTruthy()
      } catch (e) {
        nodeCmd.logger.showUserError(e)
        expect(e).toBeNull()
      }
    }, 60000)

    it('node start should succeed', async () => {
      expect.assertions(1)
      try {
        await expect(nodeCmd.start(argv)).resolves.toBeTruthy()
      } catch (e) {
        nodeCmd.logger.showUserError(e)
        expect(e).toBeNull()
      }
    }, 120000)

    it('nodes should be in ACTIVE status', async () => {
      for (const nodeId of nodeIds) {
        try {
          await expect(nodeCmd.checkNetworkNodeStarted(nodeId, 5)).resolves.toBeTruthy()
        } catch (e) {
          testLogger.showUserError(e)
          expect(e).toBeNull()
        }

        await nodeCmd.run(`tail ${constants.SOLO_LOGS_DIR}/solo.log`)
      }
    }, 60000)

    it('only genesis account should have genesis key', async () => {
      expect.hasAssertions()
      let client = null
      const genesisKey = PrivateKey.fromStringED25519(constants.OPERATOR_KEY)
      const realm = constants.HEDERA_NODE_ACCOUNT_ID_START.realm
      const shard = constants.HEDERA_NODE_ACCOUNT_ID_START.shard
      try {
        client = await TestHelper.getNodeClient(accountManager, argv)

        const accountUpdatePromiseArray = []
        for (const [start, end] of constants.SYSTEM_ACCOUNTS) {
          for (let i = start; i <= end; i++) {
            accountUpdatePromiseArray.push((async function (i) {
              const accountId = `${realm}.${shard}.${i}`
              const keys = await accountManager.getAccountKeys(accountId, client)
              expect(keys[0].toString()).not.toEqual(genesisKey)
            })(i))
          }
        }
        await Promise.allSettled(accountUpdatePromiseArray).then((results) => {
          for (const result of results) {
            if (result.status === 'rejected') {
              throw new Error(`accountId failed to update the account ID and create its secret: ${result.value}`)
            }
          }
        })
      } catch (e) {
        testLogger.showUserError(e)
        expect(e).toBeNull()
      } finally {
        if (client) {
          client.close()
        }
      }
    }, 60000)

    it('balance query should succeed', async () => {
      expect.assertions(1)
      let client = null

      try {
        client = await TestHelper.getNodeClient(accountManager, argv)

        const balance = await new AccountBalanceQuery()
          .setAccountId(client.getOperator().accountId)
          .execute(client)

        expect(balance.hbars).not.toBeNull()
      } catch (e) {
        nodeCmd.logger.showUserError(e)
        expect(e).toBeNull()
      } finally {
        if (client) {
          client.close()
        }
      }
    }, 20000)

    it('account creation should succeed', async () => {
      expect.assertions(1)
      let client = null

      try {
        client = await TestHelper.getNodeClient(accountManager, argv)
        const accountKey = PrivateKey.generate()

        let transaction = await new AccountCreateTransaction()
          .setNodeAccountIds([constants.HEDERA_NODE_ACCOUNT_ID_START])
          .setInitialBalance(new Hbar(0))
          .setKey(accountKey.publicKey)
          .freezeWith(client)

        transaction = await transaction.sign(accountKey)
        const response = await transaction.execute(client)
        const receipt = await response.getReceipt(client)

        expect(receipt.accountId).not.toBeNull()
      } catch (e) {
        nodeCmd.logger.showUserError(e)
        expect(e).toBeNull()
      } finally {
        if (client) {
          client.close()
        }
      }
    }, 20000)
  })
})
