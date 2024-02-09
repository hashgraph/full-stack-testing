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
  PrivateKey, Status
} from '@hashgraph/sdk'
import { FullstackTestingError } from './errors.mjs'
import { sleep } from './helpers.mjs'
import net from 'net'
import { LOCAL_NODE_START_PORT } from './constants.mjs'
import chalk from 'chalk'

const REASON_FAILED_TO_GET_KEYS = 'failed to get keys for accountId'
const REASON_SKIPPED = 'skipped since it does not have a genesis key'
const REASON_FAILED_TO_UPDATE_ACCOUNT = 'failed to update account keys'
const REASON_FAILED_TO_CREATE_SECRET = 'failed to create secret'

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
    // TODO add disable account key update flag to node start commands or future GH Issue?
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
      const realm = constants.HEDERA_NODE_ACCOUNT_ID_START.realm
      const shard = constants.HEDERA_NODE_ACCOUNT_ID_START.shard
      let accountIdNum = parseInt(constants.HEDERA_NODE_ACCOUNT_ID_START.num.toString(), 10)
      let localPort = LOCAL_NODE_START_PORT

      for (const serviceObject of serviceMap.values()) {
        // TODO need to use the account keys from the node metadata
        if (!this.isLocalhost() && !serviceObject.loadBalancerIp) {
          throw new Error(
              `Expected service ${serviceObject.name} to have a loadBalancerIP set for basepath ${this.k8.kubeClient.basePath}`)
        }
        const host = this.isLocalhost() ? '127.0.0.1' : serviceObject.loadBalancerIp
        const port = serviceObject.grpcPort // TODO add grpcs logic
        const accountId = AccountId.fromString(`${realm}.${shard}.${accountIdNum}`)
        const targetPort = this.isLocalhost() ? localPort : port

        if (this.isLocalhost()) {
          this.portForwards.push(await this.k8.portForward(serviceObject.podName, localPort, port))
        }

        nodes[`${host}:${targetPort}`] = accountId
        await this.testConnection(serviceObject.podName, host, targetPort)

        localPort++
        accountIdNum++
      }

      this.logger.debug(`creating client from network configuration: ${JSON.stringify(nodes)}`)
      const nodeClient = Client.fromConfig({ network: nodes })
      nodeClient.setOperator(constants.OPERATOR_ID, constants.OPERATOR_KEY)

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
    const serviceMap = new Map()

    const serviceList = await this.k8.kubeClient.listNamespacedService(
      namespace, undefined, undefined, undefined, undefined, labelSelector)

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

        await sleep(constants.ACCOUNT_KEYS_UPDATE_PAUSE) // sleep a little to prevent overwhelming the servers
      }
    }

    await Promise.allSettled(accountUpdatePromiseArray).then((results) => {
      let rejectedCount = 0
      let fulfilledCount = 0
      let skippedCount = 0

      for (const result of results) {
        switch (result.status) {
          case 'rejected':
            if (result.reason === REASON_SKIPPED) {
              skippedCount++
            } else {
              this.logger.error(`REJECT: ${result.reason}: ${result.value}`)
              rejectedCount++
            }
            break
          case 'fulfilled':
            fulfilledCount++
            break
        }
      }
      this.logger.showUser(chalk.green(`Account keys updated SUCCESSFULLY: ${fulfilledCount}`))
      if (skippedCount > 0) this.logger.showUser(chalk.cyan(`Account keys updates SKIPPED: ${skippedCount}`))
      if (rejectedCount > 0) this.logger.showUser(chalk.yellowBright(`Account keys updates with ERROR: ${rejectedCount}`))
    })
  }

  async updateAccountKeys (namespace, nodeClient, accountId, genesisKey) {
    let keys
    try {
      keys = await this.getAccountKeys(accountId, nodeClient)
      this.logger.debug(`retrieved keys for account ${accountId.toString()}`)
    } catch (e) {
      this.logger.error(`failed to get keys for accountId ${accountId.toString()}, e: ${e.toString()}\n  ${e.stack}`)
      return {
        status: 'rejected',
        reason: REASON_FAILED_TO_GET_KEYS,
        value: accountId.toString()
      }
    }

    if (constants.OPERATOR_PUBLIC_KEY !== keys[0].toString()) {
      this.logger.debug(`account ${accountId.toString()} can be skipped since it does not have a genesis key`)
      return {
        status: 'rejected',
        reason: REASON_SKIPPED,
        value: accountId.toString()
      }
    }

    const newPrivateKey = PrivateKey.generateED25519()
    try {
      if (!(await this.sendAccountKeyUpdate(accountId, newPrivateKey, nodeClient, genesisKey))) {
        this.logger.error(`failed to update account keys for accountId ${accountId.toString()}`)
        return {
          status: 'rejected',
          reason: REASON_FAILED_TO_UPDATE_ACCOUNT,
          value: accountId.toString()
        }
      }
      this.logger.debug(`sent account key update for account ${accountId.toString()}`)
    } catch (e) {
      this.logger.error(`failed to update account keys for accountId ${accountId.toString()}, e: ${e.toString()}`)
      return {
        status: 'rejected',
        reason: REASON_FAILED_TO_UPDATE_ACCOUNT,
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
          reason: REASON_FAILED_TO_CREATE_SECRET,
          value: accountId.toString()
        }
      }
      this.logger.debug(`created k8s secret for account ${accountId.toString()}`)
    } catch (e) {
      this.logger.error(`failed to create secret for accountId ${accountId.toString()}, e: ${e.toString()}`)
      return {
        status: 'rejected',
        reason: REASON_FAILED_TO_CREATE_SECRET,
        value: accountId.toString()
      }
    }

    return {
      status: 'fulfilled',
      value: accountId.toString()
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

    this.logger.debug(
        `The transaction consensus status for update of accountId ${accountId.toString()} is ${receipt.status}`)

    return receipt.status === Status.Success
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
