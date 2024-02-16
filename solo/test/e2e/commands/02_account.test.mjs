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
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it
} from '@jest/globals'
import {
  ChartManager,
  ConfigManager,
  constants,
  DependencyManager,
  Helm,
  K8
} from '../../../src/core/index.mjs'
import { getTestCacheDir, testLogger } from '../../test_util.js'
import path from 'path'
import { AccountManager } from '../../../src/core/account_manager.mjs'
import { AccountCommand } from '../../../src/commands/account.mjs'
import { flags } from '../../../src/commands/index.mjs'
import { sleep } from '../../../src/core/helpers.mjs'
import { FileContentsQuery, FileId } from '@hashgraph/sdk'
import * as HashgraphProto from '@hashgraph/proto'
import * as Base64 from 'js-base64'
import fs from 'fs'

describe('account commands should work correctly', () => {
  const defaultTimeout = 20000
  let accountCmd
  let accountManager
  let configManager
  let k8
  let helm
  let chartManager
  let depManager
  let argv = {}
  let accountId1
  let accountId2

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
  })

  beforeEach(() => {
    configManager.reset()
    argv = {}
    argv[flags.cacheDir.name] = getTestCacheDir('accountCmd')
    argv[flags.namespace.name] = 'solo-e2e'
    argv[flags.clusterName.name] = 'kind-solo-e2e'
    argv[flags.clusterSetupNamespace.name] = 'solo-e2e-cluster'
    configManager.update(argv, true)
  })

  afterEach(() => {
    sleep(5).then().catch() // give a few ticks so that connections can close
  })

  it('account create with no options', async () => {
    try {
      await expect(accountCmd.create(argv)).resolves.toBeTruthy()

      const accountInfo = accountCmd.accountInfo
      expect(accountInfo).not.toBeNull()
      expect(accountInfo.accountId).not.toBeNull()
      accountId1 = accountInfo.accountId
      expect(accountInfo.privateKey).not.toBeNull()
      expect(accountInfo.publicKey).not.toBeNull()
      expect(accountInfo.balance).toEqual(flags.amount.definition.defaultValue)
    } catch (e) {
      testLogger.showUserError(e)
      expect(e).toBeNull()
    } finally {
      await accountCmd.closeConnections()
    }
  }, defaultTimeout)

  it('account create with private key and hbar amount options', async () => {
    try {
      argv[flags.privateKey.name] = constants.GENESIS_KEY
      argv[flags.amount.name] = 777
      configManager.update(argv, true)

      await expect(accountCmd.create(argv)).resolves.toBeTruthy()

      const accountInfo = accountCmd.accountInfo
      expect(accountInfo).not.toBeNull()
      expect(accountInfo.accountId).not.toBeNull()
      accountId2 = accountInfo.accountId
      expect(accountInfo.privateKey.toString()).toEqual(constants.GENESIS_KEY)
      expect(accountInfo.publicKey).not.toBeNull()
      expect(accountInfo.balance).toEqual(777)
    } catch (e) {
      testLogger.showUserError(e)
      expect(e).toBeNull()
    } finally {
      await accountCmd.closeConnections()
    }
  }, defaultTimeout)

  it('account update with account', async () => {
    try {
      argv[flags.accountId.name] = accountId1
      configManager.update(argv, true)

      await expect(accountCmd.update(argv)).resolves.toBeTruthy()

      const accountInfo = accountCmd.accountInfo
      expect(accountInfo).not.toBeNull()
      expect(accountInfo.accountId).toEqual(argv[flags.accountId.name])
      expect(accountInfo.privateKey).toBeUndefined()
      expect(accountInfo.publicKey).not.toBeNull()
      expect(accountInfo.balance).toEqual(200)
    } catch (e) {
      testLogger.showUserError(e)
      expect(e).toBeNull()
    } finally {
      await accountCmd.closeConnections()
    }
  }, defaultTimeout)

  it('account update with account, amount, new private key, and standard out options', async () => {
    try {
      argv[flags.accountId.name] = accountId2
      argv[flags.privateKey.name] = constants.GENESIS_KEY
      argv[flags.amount.name] = 333
      configManager.update(argv, true)

      await expect(accountCmd.update(argv)).resolves.toBeTruthy()

      const accountInfo = accountCmd.accountInfo
      expect(accountInfo).not.toBeNull()
      expect(accountInfo.accountId).toEqual(argv[flags.accountId.name])
      expect(accountInfo.privateKey).toBeUndefined()
      expect(accountInfo.publicKey).not.toBeNull()
      expect(accountInfo.balance).toEqual(1110)
    } catch (e) {
      testLogger.showUserError(e)
      expect(e).toBeNull()
    } finally {
      await accountCmd.closeConnections()
    }
  }, defaultTimeout)

  it('account get with account option', async () => {
    try {
      argv[flags.accountId.name] = accountId1
      configManager.update(argv, true)

      await expect(accountCmd.get(argv)).resolves.toBeTruthy()
      const accountInfo = accountCmd.accountInfo
      expect(accountInfo).not.toBeNull()
      expect(accountInfo.accountId).toEqual(argv[flags.accountId.name])
      expect(accountInfo.privateKey).toBeUndefined()
      expect(accountInfo.publicKey).toBeTruthy()
      expect(accountInfo.balance).toEqual(200)
    } catch (e) {
      testLogger.showUserError(e)
      expect(e).toBeNull()
    } finally {
      await accountCmd.closeConnections()
    }
  }, defaultTimeout)

  it('account get with account id option', async () => {
    try {
      argv[flags.accountId.name] = accountId2
      configManager.update(argv, true)

      await expect(accountCmd.get(argv)).resolves.toBeTruthy()
      const accountInfo = accountCmd.accountInfo
      expect(accountInfo).not.toBeNull()
      expect(accountInfo.accountId).toEqual(argv[flags.accountId.name])
      expect(accountInfo.privateKey).toBeUndefined()
      expect(accountInfo.publicKey).toBeTruthy()
      expect(accountInfo.balance).toEqual(1110)
    } catch (e) {
      testLogger.showUserError(e)
      expect(e).toBeNull()
    } finally {
      await accountCmd.closeConnections()
    }
  }, defaultTimeout)

  it('get NodeAddressBook', async () => {
    try {
      const ctx = {
        config: {}
      }
      ctx.config.namespace = configManager.getFlag(flags.namespace)
      await accountCmd.loadTreasuryAccount(ctx)
      await accountCmd.loadNodeClient(ctx)
      // Create the query
      const fileQuery = new FileContentsQuery()
        .setFileId(FileId.ADDRESS_BOOK)

      // Sign with the operator private key and submit to a Hedera network
      const contents = await fileQuery.execute(ctx.nodeClient)
      const nodeAddressBook = TestHelper.getFirstNodeAddress(contents)

      // const secret = await k8.getSecret(ctx.config.namespace, 'app.kubernetes.io/component=importer')
      const result = await k8.kubeClient.listNamespacedSecret(
        ctx.config.namespace, null, null, null, null, 'app.kubernetes.io/component=importer')
      if (result.response.statusCode === 200 && result.body.items && result.body.items.length > 0) {
        const secretObject = result.body.items[0]
        delete secretObject.metadata.creationTimestamp
        delete secretObject.metadata.managedFields
        delete secretObject.metadata.resourceVersion
        delete secretObject.metadata.uid
        secretObject.data['addressbook.bin'] = Base64.toBase64(nodeAddressBook.finish().toString())
        const srcPath = path.join(argv[flags.cacheDir.name], 'addressbook.bin')
        fs.writeFileSync(srcPath, nodeAddressBook.finish())
        console.log(`srcPath: ${srcPath}`)
        // patch is broke, need to use delete/create: https://github.com/kubernetes-client/javascript/issues/893
        // await k8.kubeClient.patchNamespacedSecret(secret.name, ctx.config.namespace, secret.data)
        await k8.kubeClient.deleteNamespacedSecret(secretObject.metadata.name, ctx.config.namespace)
        await k8.kubeClient.createNamespacedSecret(ctx.config.namespace, secretObject)
        console.log('done')
      }

      // const srcPath = path.join(argv[flags.cacheDir.name], 'addressbook.bin')
      // fs.writeFileSync(srcPath, nodeAddressBook.finish())
      // await k8.copyTo('fullstack-deployment-importer-645457bd57-58n94', 'importer', srcPath, '/usr/etc/hedera/..2024_02_16_17_29_09.4048515600')
    } catch (e) {
      testLogger.showUserError(e)
      expect(e).toBeNull()
    } finally {
      await accountCmd.closeConnections()
    }
  }, defaultTimeout)
})

class TestHelper {
  /**
   * @internal
   * @param {HashgraphProto.proto.INodeAddressBook} nodeAddressBook
   * @returns {NodeAddressBook}
   */
  static getFirstNodeAddress (nodeAddressBook) {
    // const nodeAddress = HashgraphProto.proto.NodeAddressBook.decode(nodeAddressBook).nodeAddress[0]
    // return HashgraphProto.proto.NodeAddressBook.encode(HashgraphProto.proto.NodeAddressBook.create({ nodeAddress: [nodeAddress] }))
    const nodeAddress = HashgraphProto.proto.NodeAddressBook.decode(nodeAddressBook).nodeAddress[0]
    return HashgraphProto.proto.NodeAddress.encode(nodeAddress)
  }
}
