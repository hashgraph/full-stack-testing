import { ShellRunner } from './shell_runner.mjs'

export class Helm extends ShellRunner {
  /**
     * Prepare a `helm` shell command string
     * @param action represents a helm command (e.g. create | install | get )
     * @param args args of the command
     * @returns {string}
     */
  prepareCommand(action, ...args) {
    let cmd = `helm ${action}`
    args.forEach(arg => { cmd += ` ${arg}` })
    return cmd
  }

  /**
     * Invoke `helm install` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
  async install(...args) {
    return this.run(this.prepareCommand('install', ...args), true)
  }

  /**
     * Invoke `helm uninstall` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
  async uninstall(...args) {
    return this.run(this.prepareCommand('uninstall', ...args))
  }

  /**
     * Invoke `helm upgrade` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
  async upgrade(...args) {
    return this.run(this.prepareCommand('upgrade', ...args))
  }

  /**
     * Invoke `helm list` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
  async list(...args) {
    return this.run(this.prepareCommand('list', ...args))
  }

  /**
     * Invoke `helm dependency` command
     * @param subCommand sub-command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
  async dependency(subCommand, ...args) {
    return this.run(this.prepareCommand('dependency', subCommand, ...args))
  }

  /**
     * Invoke `helm repo` command
     * @param subCommand sub-command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
  async repo(subCommand, ...args) {
    return this.run(this.prepareCommand('repo', subCommand, ...args))
  }
}
