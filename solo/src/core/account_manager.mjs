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
import * as constants from './constants.mjs'
import {
  AccountId,
  AccountInfoQuery, AccountUpdateTransaction,
  Client,
  KeyList,
  PrivateKey
} from '@hashgraph/sdk'
import { FullstackTestingError } from './errors.mjs'
import { sleep } from './helpers.mjs'
import net from 'net'
import { LOCAL_NODE_START_PORT } from './constants.mjs'

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
export class AccountManager {
  constructor (logger, k8, constants) {
    if (!logger) throw new Error('An instance of core/Logger is required')
    if (!k8) throw new Error('An instance of core/K8 is required')

    this.logger = logger
    this.k8 = k8
    this.portForwards = []
  }

  // TODO why does it prompt me for the chart directory during cluster setup even though I specified during init?
  // TODO add jsdoc
  async prepareAccount (namespace) {
    // TODO add disable account key update flag to node start commands
    const serviceMap = await this.getNodeServiceMap(namespace)

    const nodeClient = await this.getNodeClient(namespace, serviceMap)

    // TODO update before PR merge
    // await this.updateSpecialAccountsKeys(namespace, nodeClient, constants.SYSTEM_ACCOUNTS)
    // update the treasury 0.0.2 account last
    // await this.updateSpecialAccountsKeys(namespace, nodeClient, [[2, 2]])
    await this.updateSpecialAccountsKeys(namespace, nodeClient, [[4, 4]])
    nodeClient.close()
    await this.stopPortForwards()
  }

  async stopPortForwards () {
    this.portForwards.forEach(server => {
      server.close()
    })
    this.portForwards = []
  }

  async getNodeClient (namespace, serviceMap) {
    const nodes = {}
    try {
      let localPort = LOCAL_NODE_START_PORT
      let accountIdNum = parseInt(constants.HEDERA_NODE_ACCOUNT_ID_START.num.toString(), 10)

      for (const serviceObject of serviceMap.values()) {
        // TODO need to use the account keys from the node metadata
        const isLocalHost = this.isLocalhost()
        if (!isLocalHost && !serviceObject.loadBalancerIp) {
          throw new Error(
              `Expected service ${serviceObject.name} to have a loadBalancerIP set for basepath ${this.k8.kubeClient.basePath}`)
        }
        const host = isLocalHost ? '127.0.0.1' : serviceObject.loadBalancerIp
        const port = serviceObject.grpcPort // TODO add grpcs logic
        const accountId = AccountId.fromString(`${constants.HEDERA_NODE_ACCOUNT_ID_START.realm}.${constants.HEDERA_NODE_ACCOUNT_ID_START.shard}.${accountIdNum}`)
        const targetPort = isLocalHost ? localPort : port

        if (isLocalHost) {
          this.portForwards.push(await this.k8.portForward(serviceObject.podName, localPort, port))
        }

        nodes[`${host}:${targetPort}`] = accountId
        this.testConnection(serviceObject.podName, host, targetPort)

        localPort++
        accountIdNum++
      }

      this.logger.debug(`creating client from network configuration: ${JSON.stringify(nodes)}`)
      const nodeClient = Client.fromConfig({ network: nodes })
      nodeClient.setOperator(constants.OPERATOR_ID, constants.OPERATOR_KEY)
      // TODO add grpcs logic
      // if (this.isLocalhost()) {
      //   // const nodeAddressBook = new NodeAddressBook()
      //   // nodeClient.setNetworkFromAddressBook(nodeAddressBook)
      //   nodeClient.setTransportSecurity(true)
      // }
      return nodeClient
    } catch (e) {
      throw new FullstackTestingError('failed to setup node client', e)
    }
  }

  isLocalhost () {
    return this.k8.kubeClient.basePath.includes('127.0.0.1')
  }

  /**
   * Gets a Map of the Hedera node services and the attributes needed
   * @param namespace the namespace of the fullstack network deployment
   * @returns {Map<any, any>} the Map of <nodeName:string, serviceObject>
   */
  async getNodeServiceMap (namespace) {
    const labelSelector = 'fullstack.hedera.com/node-name,fullstack.hedera.com/type=haproxy-svc'
    // TODO move to K8
    const serviceList = await this.k8.kubeClient.listNamespacedService(
      namespace, undefined, undefined, undefined, undefined, labelSelector)
    const serviceMap = new Map()

    // retrieve the list of services and build custom objects for the attributes we need
    for (const service of serviceList.body.items) {
      const serviceObject = {}
      serviceObject.name = service.metadata.name
      serviceObject.loadBalancerIp = service.status.loadBalancer.ingress ? service.status.loadBalancer.ingress[0].ip : undefined
      serviceObject.grpcPort = service.spec.ports.filter(port => port.name === 'non-tls-grpc-client-port')[0].port
      serviceObject.grpcsPort = service.spec.ports.filter(port => port.name === 'tls-grpc-client-port')[0].port
      serviceObject.node = service.metadata.labels['fullstack.hedera.com/node-name']
      serviceObject.selector = service.spec.selector.app
      serviceMap.set(serviceObject.node, serviceObject)
    }

    // get the pod name for the service to use with portForward if needed
    for (const serviceObject of serviceMap.values()) {
      const labelSelector = `app=${serviceObject.selector}`
      const podList = await this.k8.kubeClient.listNamespacedPod(
        namespace, null, null, null, null, labelSelector)
      serviceObject.podName = podList.body.items[0].metadata.name
    }

    return serviceMap
  }

  async updateSpecialAccountsKeys (namespace, nodeClient, accounts) {
    const genesisKey = PrivateKey.fromStringED25519(constants.OPERATOR_KEY)
    const accountUpdatePromiseArray = []

    for (const [start, end] of accounts) {
      for (let i = start; i <= end; i++) {
        accountUpdatePromiseArray.push(this.updateAccountKeys(
          namespace, nodeClient, AccountId.fromString(`${constants.HEDERA_NODE_ACCOUNT_ID_START.realm}.${constants.HEDERA_NODE_ACCOUNT_ID_START.shard}.${i}`), genesisKey))
        // TODO make this a flag that can be passed in, or a constant / environment variable
        await sleep(5) // sleep a little to prevent overwhelming the servers
      }
    }
    await Promise.allSettled(accountUpdatePromiseArray).then((results) => {
      // TODO write a better summary here, and use info messages (fulfilled counts, rejects, skips, etc.)
      for (const result of results) {
        if (result.status === 'rejected') {
          this.logger.error(`accountId failed to update the account ID and create its secret: ${result.value}`)
        }
      }
    })
  }

  async updateAccountKeys (namespace, nodeClient, accountId, genesisKey) {
    try {
      let keys
      try {
        keys = await this.getAccountKeys(accountId, nodeClient)
        this.logger.debug(`retrieved keys for account ${accountId.toString()}`)
      } catch (e) {
        this.logger.error(`failed to get keys for accountId ${accountId.toString()}, e: ${e.toString()}\n  ${e.stack}`)
        return {
          status: 'rejected',
          value: accountId.toString()
        }
      }

      if (constants.OPERATOR_PUBLIC_KEY !== keys[0].toString()) {
        this.logger.debug(`account ${accountId.toString()} can be skipped since it does not have a genesis key`)
        return {
          status: 'skipped',
          value: accountId.toString()
        }
      }

      const newPrivateKey = PrivateKey.generateED25519()
      try {
        await this.sendAccountKeyUpdate(accountId, newPrivateKey, nodeClient, genesisKey)
        this.logger.debug(`sent account key update for account ${accountId.toString()}`)
      } catch (e) {
        this.logger.error(`failed to update account keys for accountId ${accountId.toString()}, e: ${e.toString()}`)
        return {
          status: 'rejected',
          value: accountId.toString()
        }
      }

      const data = {
        privateKey: newPrivateKey.toString(),
        publicKey: newPrivateKey.publicKey.toString()
      }

      // TODO secrets didn't delete when chart was uninstalled.  this okay? rerun to see if it overlays correctly?
      // TODO what happens if secret fails to create?  alter name and try again?  revert to genesis key?
      try {
        if (!(await this.k8.createSecret(`account-key-${accountId.toString()}`, namespace, 'Opaque', data))) {
          this.logger.error(`failed to create secret for accountId ${accountId.toString()}`)
          return {
            status: 'rejected',
            value: accountId.toString()
          }
        }
        this.logger.debug(`created k8s secret for account ${accountId.toString()}`)
      } catch (e) {
        this.logger.error(`failed to create secret for accountId ${accountId.toString()}, e: ${e.toString()}`)
        return {
          status: 'rejected',
          value: accountId.toString()
        }
      }

      return {
        status: 'fulfilled',
        value: accountId.toString()
      }
    } catch (e) {
      this.logger.error(`account: ${accountId.toString()}, had an error: ${e.toString()}`)
      return {
        status: 'rejected',
        value: accountId.toString()
      }
    }
  }

  async getAccountKeys (accountId, nodeClient) {
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(accountId)
      .execute(nodeClient)

    let keys
    if (accountInfo.key instanceof KeyList) {
      keys = accountInfo.key.toArray()
    } else {
      keys = []
      keys.push(accountInfo.key)
    }

    return keys
  }

  async sendAccountKeyUpdate (accountId, newPrivateKey, nodeClient, genesisKey) {
    this.logger.debug(
        `Updating account ${accountId.toString()} with new public and private keys`)

    // Create the transaction to update the key on the account
    const transaction = await new AccountUpdateTransaction()
      .setAccountId(accountId)
      .setKey(newPrivateKey.publicKey)
      .freezeWith(nodeClient)

    // Sign the transaction with the old key and new key
    const signTx = await (await transaction.sign(genesisKey)).sign(
      newPrivateKey)

    // SIgn the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await signTx.execute(nodeClient)

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(nodeClient)

    // Get the transaction consensus status
    const transactionStatus = receipt.status

    this.logger.debug(
        `The transaction consensus status for update of accountId ${accountId.toString()} is ${transactionStatus.toString()}`)
    // TODO check status is correct before continuing
  }

  async jeromyTesting (argv) {
    const { namespace } = argv
    const serviceMap = await this.getNodeServiceMap(namespace)
    return {
      serviceMap,
      basePath: this.k8.kubeClient.basePath
    }
  }

  async testConnection (podName, host, port) {
    // check if the port is actually accessible
    let attempt = 1
    let socket = null
    while (attempt < 10) {
      try {
        await sleep(250)
        this.logger.debug(`Checking exposed port '${port}' of pod ${podName} at IP address ${host}`)
        socket = net.createConnection({ host, port })
        this.logger.debug(`Connected to port '${port}' of pod ${podName} at IP address ${host}`)
        break
      } catch (e) {
        attempt += 1
      }
    }
    if (!socket) {
      throw new FullstackTestingError(`failed to connect to port '${port}' of pod ${podName} at IP address ${host}`)
    }
    socket.destroy()
  }
}
