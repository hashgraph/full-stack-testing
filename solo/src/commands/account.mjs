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
import { BaseCommand } from './base.mjs'
import { FullstackTestingError, IllegalArgumentError } from '../core/errors.mjs'
import { flags } from './index.mjs'
import { Listr } from 'listr2'
import * as prompts from './prompts.mjs'
import { constants } from '../core/index.mjs'
import { sleep } from '../core/helpers.mjs'
import { HbarUnit, PrivateKey } from '@hashgraph/sdk'

export class AccountCommand extends BaseCommand {
  constructor (opts) {
    super(opts)

    if (!opts || !opts.accountManager) throw new IllegalArgumentError('An instance of core/AccountManager is required', opts.accountManager)

    this.accountManager = opts.accountManager
    this.nodeClient = null
    this.ctx = null
  }

  async create (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          self.ctx = ctx // useful for validation in e2e testing
          self.configManager.update(argv)
          await prompts.execute(task, self.configManager, [
            flags.namespace
          ])

          const config = {
            namespace: self.configManager.getFlag(flags.namespace),
            privateKey: self.configManager.getFlag(flags.privateKey),
            amount: self.configManager.getFlag(flags.amount),
            stdout: self.configManager.getFlag(flags.stdout)
          }

          if (!config.amount) {
            config.amount = flags.amount.definition.defaultValue
          }

          if (!await this.k8.hasNamespace(config.namespace)) {
            throw new FullstackTestingError(`namespace ${config.namespace} does not exist`)
          }

          // set config in the context for later tasks to use
          ctx.config = config

          self.logger.debug('Initialized config', { config })

          await self.loadTreasuryAccount(ctx)
          await self.loadNodeClient(ctx)
        }
      },
      {
        title: 'create the new account',
        task: async (ctx, task) => {
          await self.createNewAccount(ctx)
        }
      }
    ], {
      concurrent: false,
      rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
    })

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError(`Error in creating account: ${e.message}`, e)
    } finally {
      await this.closeConnections()
    }

    return true
  }

  async createNewAccount (ctx) {
    if (ctx.config.privateKey) {
      ctx.privateKey = PrivateKey.fromStringED25519(ctx.config.privateKey)
    } else {
      ctx.privateKey = PrivateKey.generateED25519()
    }

    ctx.accountInfo = await this.accountManager.createNewAccount(ctx.config.namespace,
      ctx.nodeClient, ctx.privateKey, ctx.config.amount)

    const accountInfoCopy = { ...ctx.accountInfo }
    if (!ctx.config.stdout) {
      delete accountInfoCopy.privateKey
    }

    this.logger.showJSON('new account created', accountInfoCopy)
  }

  async loadNodeClient (ctx) {
    const serviceMap = await this.accountManager.getNodeServiceMap(ctx.config.namespace)

    ctx.nodeClient = await this.accountManager.getNodeClient(ctx.config.namespace,
      serviceMap, ctx.treasuryAccountId, ctx.treasuryPrivateKey)
    this.nodeClient = ctx.nodeClient // store in class so that we can make sure connections are closed
  }

  async loadTreasuryAccount (ctx) {
    ctx.treasuryAccountId = constants.TREASURY_ACCOUNT_ID
    // check to see if the treasure account is in the secrets
    const accountInfo = await this.accountManager.getAccountKeysFromSecret(ctx.treasuryAccountId, ctx.config.namespace)

    // if it isn't in the secrets we can load genesis key
    if (accountInfo) {
      ctx.treasuryPrivateKey = accountInfo.privateKey
    } else {
      ctx.treasuryPrivateKey = constants.GENESIS_KEY
    }
  }

  async getAccountInfo (ctx) {
    return this.accountManager.accountInfoQuery(ctx.config.accountId, ctx.nodeClient)
  }

  async update (argv) {
    const self = this
  }

  async get (argv) {
    const self = this

    const tasks = new Listr([
      {
        title: 'Initialize',
        task: async (ctx, task) => {
          self.ctx = ctx // useful for validation in e2e testing
          self.configManager.update(argv)
          await prompts.execute(task, self.configManager, [
            flags.namespace,
            flags.accountId
          ])

          const config = {
            namespace: self.configManager.getFlag(flags.namespace),
            accountId: self.configManager.getFlag(flags.accountId),
            stdout: self.configManager.getFlag(flags.stdout)
          }

          if (!await this.k8.hasNamespace(config.namespace)) {
            throw new FullstackTestingError(`namespace ${config.namespace} does not exist`)
          }

          // set config in the context for later tasks to use
          ctx.config = config

          self.logger.debug('Initialized config', { config })
        }
      },
      {
        title: 'get the account info',
        task: async (ctx, task) => {
          await self.loadTreasuryAccount(ctx)
          await self.loadNodeClient(ctx)
          const accountInfo = await self.getAccountInfo(ctx)
          ctx.accountInfo = {
            accountId: accountInfo.accountId.toString(),
            publicKey: accountInfo.key.toString(),
            balance: accountInfo.balance.to(HbarUnit.Hbar).toNumber()
          }

          if (ctx.config.stdout) {
            const accountKeys = await this.accountManager.getAccountKeysFromSecret(ctx.accountInfo.accountId, ctx.config.namespace)
            ctx.accountInfo.privateKey = accountKeys.privateKey
          }
          this.logger.showJSON('account info', ctx.accountInfo)
        }
      }
    ], {
      concurrent: false,
      rendererOptions: constants.LISTR_DEFAULT_RENDERER_OPTION
    })

    try {
      await tasks.run()
    } catch (e) {
      throw new FullstackTestingError(`Error in creating account: ${e.message}`, e)
    } finally {
      await this.closeConnections()
    }

    return true
  }

  /**
   * Return Yargs command definition for 'node' command
   * @param accountCmd an instance of NodeCommand
   */
  static getCommandDefinition (accountCmd) {
    return {
      command: 'account',
      desc: 'Manage Hedera accounts in fullstack testing network',
      builder: yargs => {
        return yargs
          .command({
            command: 'create',
            desc: 'Creates a new account with a new key and stores the key in the Kubernetes secrets',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.privateKey,
              flags.amount,
              flags.stdout
            ),
            handler: argv => {
              accountCmd.logger.debug("==== Running 'account create' ===")
              accountCmd.logger.debug(argv)

              accountCmd.create(argv).then(r => {
                accountCmd.logger.debug("==== Finished running 'account create' ===")
                if (!r) process.exit(1)
              }).catch(err => {
                accountCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'update',
            desc: 'Updates an existing account with the provided info\n',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.accountId,
              flags.newPrivateKey,
              flags.amount,
              flags.stdout
            ),
            handler: argv => {
              accountCmd.logger.debug("==== Running 'account update' ===")
              accountCmd.logger.debug(argv)

              accountCmd.update(argv).then(r => {
                accountCmd.logger.debug("==== Finished running 'account update' ===")
                if (!r) process.exit(1)
              }).catch(err => {
                accountCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .command({
            command: 'get',
            desc: 'Gets the account info including the current amount of HBAR',
            builder: y => flags.setCommandFlags(y,
              flags.namespace,
              flags.accountId,
              flags.stdout
            ),
            handler: argv => {
              accountCmd.logger.debug("==== Running 'account get' ===")
              accountCmd.logger.debug(argv)

              accountCmd.get(argv).then(r => {
                accountCmd.logger.debug("==== Finished running 'account get' ===")
                if (!r) process.exit(1)
              }).catch(err => {
                accountCmd.logger.showUserError(err)
                process.exit(1)
              })
            }
          })
          .demandCommand(1, 'Select an account command')
      }
    }
  }

  async closeConnections () {
    if (this.nodeClient) {
      this.nodeClient.close()
      await sleep(5) // sleep a couple of ticks for connections to close
    }
    await this.accountManager.stopPortForwards()
    await sleep(5) // sleep a couple of ticks for connections to close
  }
}
