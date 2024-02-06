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
  AccountCreateTransaction, Client,
  Hbar,
  LocalProvider,
  PrivateKey,
  Wallet
} from '@hashgraph/sdk'
import { afterEach, beforeAll, describe, expect, it } from '@jest/globals'
import net from 'net'
import path from 'path'
import { namespace } from '../../../src/commands/flags.mjs'
import { flags } from '../../../src/commands/index.mjs'
import { NodeCommand } from '../../../src/commands/node.mjs'
import { FullstackTestingError, MissingArgumentError } from '../../../src/core/errors.mjs'
import { sleep } from '../../../src/core/helpers.mjs'
import {
  ChartManager,
  ConfigManager,
  Helm,
  K8,
  PackageDownloader,
  PlatformInstaller,
  constants,
  DependencyManager,
  Templates, KeyManager
} from '../../../src/core/index.mjs'
import { ShellRunner } from '../../../src/core/shell_runner.mjs'
import { getTestCacheDir, testLogger } from '../../test_util.js'

class TestHelper {
  static portForwards = []

  static stopPortForwards () {
    TestHelper.portForwards.forEach(server => {
      server.close()
    })

    TestHelper.portForwards = []
  }

  static prepareNodeClient = async function (nodeCmd, nodeIds) {
    if (!nodeCmd || !(nodeCmd instanceof NodeCommand)) throw new MissingArgumentError('An instance of command/NodeCommand is required')
    try {
      if (typeof nodeIds === 'string') {
        nodeIds = nodeIds.split(',')
      }

      let localPort = 30212
      const grpcPort = constants.HEDERA_NODE_GRPC_PORT.toString()
      const network = {}

      let accountIdNum = parseInt(constants.HEDERA_NODE_ACCOUNT_ID_START.num.toString(), 10)
      for (let nodeId of nodeIds) {
        nodeId = nodeId.trim()
        const podName = Templates.renderNetworkPodName(nodeId)
        const server = await nodeCmd.k8.portForward(podName, localPort, grpcPort)
        TestHelper.portForwards.push(server)

        // check if the port is actually accessible
        let attempt = 1
        let socket = null
        while (attempt < 10) {
          try {
            await sleep(1000)
            nodeCmd.logger.debug(`Checking exposed port '${localPort}' of node ${nodeId}`)
            // `nc -zv 127.0.0.1 ${localPort}`
            socket = net.createConnection({ port: localPort })
            nodeCmd.logger.debug(`Connected to exposed port '${localPort}' of node ${nodeId}`)
            break
          } catch (e) {
            attempt += 1
          }
        }

        if (!socket) {
          throw new FullstackTestingError(`failed to expose port '${grpcPort}' of node '${nodeId}'`)
        }

        socket.destroy()

        network[`127.0.0.1:${localPort}`] = `${constants.HEDERA_NODE_ACCOUNT_ID_START.realm}.${constants.HEDERA_NODE_ACCOUNT_ID_START.shard}.${accountIdNum}`

        accountIdNum += 1
        localPort += 1
      }

      return Client.fromConfig({ network })
    } catch (e) {
      throw new FullstackTestingError('failed to setup node client', e)
    }
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

  const nodeCmd = new NodeCommand({
    logger: testLogger,
    helm,
    k8,
    chartManager,
    configManager,
    downloader: packageDownloader,
    platformInstaller,
    depManager,
    keyManager
  })

  const cacheDir = getTestCacheDir()

  afterEach(() => {
    TestHelper.stopPortForwards()
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
    }, 60000)

    it('nodes should be in ACTIVE status', async () => {
      for (const nodeId of nodeIds) {
        try {
          await expect(nodeCmd.checkNetworkNodeStarted(nodeId, 5)).resolves.toBeTruthy()
        } catch (e) {
          testLogger.showUserError(e)
        }

        await nodeCmd.run(`tail ${constants.SOLO_LOGS_DIR}/solo.log`)
      }
    }, 60000)

    it('balance query should succeed', async () => {
      expect.assertions(1)
      let client = null

      try {
        client = await TestHelper.prepareNodeClient(nodeCmd, argv[flags.nodeIDs.name])
        const wallet = new Wallet(
          constants.OPERATOR_ID,
          constants.OPERATOR_KEY,
          new LocalProvider({ client })
        )

        const balance = await new AccountBalanceQuery()
          .setAccountId(wallet.accountId)
          .executeWithSigner(wallet)

        expect(balance.hbars).not.toBeNull()
      } catch (e) {
        nodeCmd.logger.showUserError(e)
        expect(e).toBeNull()
      }

      if (client) {
        client.close()
      }
    }, 20000)

    it('account creation should succeed', async () => {
      expect.assertions(1)
      let client = null

      try {
        client = await TestHelper.prepareNodeClient(nodeCmd, argv[flags.nodeIDs.name])
        const accountKey = PrivateKey.generate()
        const wallet = new Wallet(
          constants.OPERATOR_ID,
          constants.OPERATOR_KEY,
          new LocalProvider({ client })
        )

        let transaction = await new AccountCreateTransaction()
          .setInitialBalance(new Hbar(0))
          .setKey(accountKey.publicKey)
          .freezeWithSigner(wallet)

        transaction = await transaction.signWithSigner(wallet)
        const response = await transaction.executeWithSigner(wallet)
        const receipt = await response.getReceiptWithSigner(wallet)

        expect(receipt.accountId).not.toBeNull()
      } catch (e) {
        nodeCmd.logger.showUserError(e)
        expect(e).toBeNull()
      }

      if (client) {
        client.close()
      }
    }, 20000)
  })
})