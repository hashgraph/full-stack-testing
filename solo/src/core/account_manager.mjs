export class AccountManager {
  constructor (logger) {
    if (!logger) throw new Error('An instance of core/Logger is required')

    this.logger = logger
  }
}
