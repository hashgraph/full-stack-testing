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
import { namespace } from '../../../src/commands/flags.mjs'
import { flags } from '../../../src/commands/index.mjs'
import { NodeCommand } from '../../../src/commands/node.mjs'
import { FullstackTestingError, MissingArgumentError } from '../../../src/core/errors.mjs'
import { sleep } from '../../../src/core/helpers.mjs'
import {
  ChartManager,
  ConfigManager,
  Helm,
  Kubectl,
  Kubectl2,
  PackageDownloader,
  PlatformInstaller,
  constants,
  DependencyManager,
  Templates
} from '../../../src/core/index.mjs'
import { TEST_CACHE_DIR, testLogger } from '../../test_util.js'

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
        const server = await nodeCmd.kubectl2.portForward(podName, localPort, grpcPort)
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

describe('NodeCommand', () => {
  const helm = new Helm(testLogger)
  const kubectl = new Kubectl(testLogger)
  const chartManager = new ChartManager(helm, testLogger)
  const configManager = new ConfigManager(testLogger)
  const packageDownloader = new PackageDownloader(testLogger)
  const depManager = new DependencyManager(testLogger)
  const kubectl2 = new Kubectl2(configManager, testLogger)
  const platformInstaller = new PlatformInstaller(testLogger, kubectl2)

  const nodeCmd = new NodeCommand({
    logger: testLogger,
    helm,
    kubectl,
    kubectl2,
    chartManager,
    configManager,
    downloader: packageDownloader,
    platformInstaller,
    depManager
  })

  const argv = {
    releaseTag: 'v0.42.5',
    nodeIds: 'node0,node1,node2',
    cacheDir: TEST_CACHE_DIR,
    force: false,
    chainId: constants.HEDERA_CHAIN_ID
  }

  beforeAll(async () => {
    // load cached namespace
    await configManager.load()
    argv[namespace] = configManager.getFlag(flags.namespace)
  }
  )

  afterEach(() => {
    TestHelper.stopPortForwards()
  })

  describe('start', () => {
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
    },
    60000
    )

    it('nodes should be in ACTIVE status', async () => {
      const nodeIds = argv.nodeIds.split(',')
      for (const nodeId of nodeIds) {
        try {
          await expect(nodeCmd.checkNetworkNodeStarted(nodeId, 5)).resolves.toBeTruthy()
        } catch (e) {
          testLogger.showUserError(e)
        }

        await nodeCmd.run(`tail ${constants.FST_LOGS_DIR}/fst.log`)
      }
    }, 60000)

    it('balance query should succeed', async () => {
      expect.assertions(1)
      let client = null

      try {
        client = await TestHelper.prepareNodeClient(nodeCmd, argv.nodeIds)
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
        client = await TestHelper.prepareNodeClient(nodeCmd, argv.nodeIds)
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
