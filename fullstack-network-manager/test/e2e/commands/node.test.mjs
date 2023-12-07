import {
  AccountBalanceQuery,
  AccountCreateTransaction, Client,
  Hbar,
  LocalProvider,
  PrivateKey,
  Wallet
} from '@hashgraph/sdk'
import {afterAll, beforeAll, describe, expect, it} from '@jest/globals'
import net from 'net'
import {NodeCommand} from '../../../src/commands/node.mjs'
import {FullstackTestingError, MissingArgumentError} from '../../../src/core/errors.mjs'
import {sleep} from '../../../src/core/helpers.mjs'
import {
  ChartManager,
  ConfigManager,
  Helm,
  Kind,
  Kubectl,
  PackageDownloader,
  PlatformInstaller,
  constants, DependencyManager, Templates
} from '../../../src/core/index.mjs'
import {TEST_CACHE_DIR, testLogger} from '../../test_util.js'

class TestHelper {
  static killKubectlPortForwardProcesses = async function (nodeCmd) {
    if (!nodeCmd || !(nodeCmd instanceof NodeCommand)) throw new MissingArgumentError('An instance of command/NodeCommand is required')

    // kill any previous port-forwarding commands if possible
    const processIds = await nodeCmd.run('ps aux | grep "kubectl port-forward" | awk \'{print $2}\'')
    for (let pid of processIds) {
      try {
        await nodeCmd.run(`kill -9 ${pid}`)
      } catch (e) {
        // best effort kill, so ignore errors
      }
    }
  }

  static prepareNodeClient = async function (nodeCmd, nodeIds) {
    if (!nodeCmd || !(nodeCmd instanceof NodeCommand)) throw new MissingArgumentError('An instance of command/NodeCommand is required')

    try {
      if (typeof nodeIds === 'string') {
        nodeIds = nodeIds.split(',')
      }

      await TestHelper.killKubectlPortForwardProcesses(nodeCmd, nodeIds)

      let localPort = 30212
      const grpcPort = constants.HEDERA_NODE_GRPC_PORT.toString()
      const network = {}

      let accountIdNum = parseInt(constants.HEDERA_NODE_ACCOUNT_ID_START.num.toString(), 10)
      for (let nodeId of nodeIds) {
        nodeId = nodeId.trim()
        const nodeSvc = Templates.renderNodeSvcName(nodeId)
        await nodeCmd.kubectl.portForward(`svc/${nodeSvc}`, localPort, grpcPort)

        // check if the port is actually accessible
        let attempt = 1
        let socket = null
        while (attempt < 10) {
          try {
            await sleep(1000)
            nodeCmd.logger.debug(`Checking exposed port '${localPort}' of node ${nodeId}`)
            // `nc -zv 127.0.0.1 ${localPort}`
            socket = net.createConnection({port: localPort})
            nodeCmd.logger.debug(`Connected to exposed port '${localPort}' of node ${nodeId}`)
            break
          } catch (e) {
            attempt += 1
          }
        }

        if (!socket) {
          throw new FullstackTestingError(`failed to expose port '${grpcPort}' of node '${nodeId}'`)
        }
        socket.end()

        network[`127.0.0.1:${localPort}`] = `${constants.HEDERA_NODE_ACCOUNT_ID_START.realm}.${constants.HEDERA_NODE_ACCOUNT_ID_START.shard}.${accountIdNum}`

        accountIdNum += 1
        localPort += 1
      }

      return Client.fromConfig({network})
    } catch (e) {
      throw new FullstackTestingError('failed to setup node client', e)
    }
  }

  static async pingNetworkNodeGRPCPort(nodeCmd, nodeIds) {
    if (!nodeCmd || !(nodeCmd instanceof NodeCommand)) throw new MissingArgumentError('An instance of command/NodeCommand is required')

    try {
      // attempt to ping nodes several times before triggering error
      let allNodeActive = false
      let attempt = 0
      const client = await TestHelper.prepareNodeClient(nodeCmd, nodeIds)
      while (attempt < 20) {
        await sleep(1000)
        try {
          nodeCmd.logger.debug('Running ping...')
          await client.pingAll()
          allNodeActive = true
          break
        } catch (e) {
          attempt += 1
        }
      }

      if (client && client.close !== undefined) {
        client.close()
      }
      return allNodeActive
    } catch (e) {
      throw new FullstackTestingError('ping failed for all nodes', e)
    }
  }
}

describe('NodeCommand', () => {
  const kind = new Kind(testLogger)
  const helm = new Helm(testLogger)
  const kubectl = new Kubectl(testLogger)
  const chartManager = new ChartManager(helm, testLogger)
  const configManager = new ConfigManager(testLogger)
  const packageDownloader = new PackageDownloader(testLogger)
  const platformInstaller = new PlatformInstaller(testLogger, kubectl)
  const depManager = new DependencyManager(testLogger)

  const nodeCmd = new NodeCommand({
    logger: testLogger,
    kind,
    helm,
    kubectl,
    chartManager,
    configManager,
    downloader: packageDownloader,
    platformInstaller,
    depManager
  })

  const argv = {
    releaseTag: 'v0.42.5',
    namespace: constants.NAMESPACE_NAME,
    nodeIds: 'node0,node1,node2',
    cacheDir: TEST_CACHE_DIR,
    force: false,
    chainId: constants.HEDERA_CHAIN_ID
  }

  describe('start', () => {
    it('node setup should succeed', async () => {
      expect.assertions(1)
      try {
        await expect(nodeCmd.setup(argv)).resolves.toBeTruthy()
      } catch (e) {
        console.error(e)
        expect(e).toBeNull()
      }
    }, 10000)

    it('node start should succeed', async () => {
        expect.assertions(1)
        try {
          await expect(nodeCmd.start(argv)).resolves.toBeTruthy()
        } catch (e) {
          console.error(e)
          expect(e).toBeNull()
        }
      },
      20000
    )

    it('pinging all nodes should succeed', async () => {
      try {
        await expect(TestHelper.pingNetworkNodeGRPCPort(nodeCmd, argv.nodeIds)).resolves.toBeTruthy()
        await TestHelper.killKubectlPortForwardProcesses(nodeCmd)
      } catch (e) {
        console.error(e)
        expect(e).toBeNull()
      }
    }, 20000)

    it.skip('balance query should succeed', async () => {
      expect.assertions(1)
      try {
        const client = await TestHelper.prepareNodeClient(nodeCmd, argv.nodeIds)

        const wallet = new Wallet(
          constants.OPERATOR_ID,
          constants.OPERATOR_KEY,
          new LocalProvider({client})
        )

        const balance = await new AccountBalanceQuery()
          .setAccountId(wallet.accountId)
          .executeWithSigner(wallet)

        expect(balance.hbars).not.toBeNull()
      } catch (e) {
        console.error(e)
        expect(e).toBeNull()
      }
    }, 20000)

    it.skip('account creation should succeed', async () => {
      expect.assertions(1)
      try {
        const accountKey = PrivateKey.generate()
        const client = await TestHelper.prepareNodeClient(nodeCmd, argv.nodeIds)

        const wallet = new Wallet(
          constants.OPERATOR_ID,
          constants.OPERATOR_KEY,
          new LocalProvider({client})
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
        console.error(e)
        expect(e).toBeNull()
      }
    }, 20000)
  })
})
