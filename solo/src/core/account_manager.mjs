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

  // TODO add jsdoc
  async prepareAccount (namespace) {
    // TODO add disable account key update flag to node start commands
    const serviceMap = await this.getNodeServiceMap(namespace)

    const nodeClient = await this.getNodeClient(namespace, serviceMap)
    nodeClient.setOperator(constants.OPERATOR_ID, constants.OPERATOR_KEY)

    await this.updateSpecialAccountsKeys(namespace, nodeClient, constants.SYSTEM_ACCOUNTS)
    // update the treasury 0.0.2 account last
    await this.updateSpecialAccountsKeys(namespace, nodeClient, [[2, 2]])
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
      if (this.isLocalhost()) {
        for (const serviceObject of serviceMap.values()) {
          this.portForwards.push(await this.k8.portForward(serviceObject.podName, localPort, serviceObject.grpcPort))

          nodes[`127.0.0.1:${localPort}`] = `${constants.HEDERA_NODE_ACCOUNT_ID_START.realm}.${constants.HEDERA_NODE_ACCOUNT_ID_START.shard}.${accountIdNum}`
          // check if the port is actually accessible
          let attempt = 1
          let socket = null
          while (attempt < 10) {
            try {
              await sleep(250)
              this.logger.debug(`Checking exposed port '${localPort}' of pod ${serviceObject.podName}`)
              socket = net.createConnection({ port: localPort })
              this.logger.debug(`Connected to exposed port '${localPort}' of pod ${serviceObject.podName}`)
              break
            } catch (e) {
              attempt += 1
            }
          }
          if (!socket) {
            throw new FullstackTestingError(`failed to expose port '${serviceObject.grpcPort}' of pod '${serviceObject.podName}'`)
          }

          socket.destroy()
          localPort++
          accountIdNum++
        }
      } else {
        // TODO need to use the account keys from the node metadata
        for (const serviceObject of serviceMap.values()) {
          if (!serviceObject.loadBalancerIp) {
            throw new Error(
                `Expected service ${serviceObject.name} to have a loadBalancerIP set for basepath ${this.k8.kubeClient.basePath}`)
          }

          nodes[`${serviceObject.loadBalancerIp}:${serviceObject.grpcPort}`] = `${constants.HEDERA_NODE_ACCOUNT_ID_START.realm}.${constants.HEDERA_NODE_ACCOUNT_ID_START.shard}.${accountIdNum}`
          accountIdNum++
        }
      }
      // TODO test Client.setTransportSecurity(true) with grpcs
      this.logger.debug(`creating client from network configuration: ${JSON.stringify(nodes)}`)
      return Client.fromConfig({ network: nodes })
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
          namespace, nodeClient, `${constants.HEDERA_NODE_ACCOUNT_ID_START.realm}.${constants.HEDERA_NODE_ACCOUNT_ID_START.shard}.${i}`, genesisKey))
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
      const keys = await this.getAccountKeys(accountId, nodeClient)
      this.logger.debug(`retrieved keys for account ${accountId}`)

      if (constants.OPERATOR_PUBLIC_KEY !== keys[0].toString()) {
        this.logger.debug(`account ${accountId} can be skipped since it does not have a genesis key`)
        return {
          status: 'skipped',
          value: accountId
        }
      }

      const newPrivateKey = PrivateKey.generateED25519()
      await this.sendAccountKeyUpdate(accountId, newPrivateKey, nodeClient, genesisKey)
      this.logger.debug(`sent account key update for account ${accountId}`)

      const data = {
        privateKey: newPrivateKey.toString(),
        publicKey: newPrivateKey.publicKey.toString()
      }

      if (!(await this.k8.createSecret(`account-key-${accountId}`, namespace, 'Opaque', data))) {
        this.logger.error(`failed to create secret for accountId ${accountId}`)
        return {
          status: 'rejected',
          value: accountId
        }
      }
      this.logger.debug(`created k8s secret for account ${accountId}`)

      return {
        status: 'fulfilled',
        value: accountId
      }
    } catch (e) {
      console.log(`account: ${accountId}, had an error: ${e.toString()}`)
      return {
        status: 'rejected',
        value: accountId
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
        `Updating account ${accountId} with new public and private keys`)

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
        `The transaction consensus status for update of accountId ${accountId} is ${transactionStatus.toString()}`)
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
}
