import {ShellRunner} from "./shell_runner.mjs";

/**
 * Kind is a wrapper for kind CLI
 *
 * It assumes `kind` is available and invokes `kind` command directly to perform the required functions.
 *
 * Note: currently it only includes sub-set of kind commands. However, we may extend it in the future.
 * @type {Kind} an instance of Kind
 */
export const Kind = class Kind extends ShellRunner {
    /**
     * Prepare a `kind` command string
     * @param action represents a kind command (e.g. create | delete | get )
     * @param resource represents kind sub-command (e.g. cluster | nodes )
     * @param args args of the command
     * @returns {string}
     */
    prepareCommand(action, resource, ...args) {
        let cmd = `kind ${action} ${resource}`
        args.forEach(arg => {cmd += ` ${arg}`})
        return cmd
    }

    /**
     * Invoke `kind create` command
     * @param resource represents kind sub-command (e.g. cluster | nodes )
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async create(resource, ...args) {
        return this.run(this.prepareCommand('create', resource, ...args))
    }

    /**
     * Invoke `kind create cluster` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async createCluster(...args) {
        return this.create('cluster', ...args)
    }

    /**
     * Invoke `kind delete` command
     * @param resource represents kind sub-command (e.g. cluster | nodes )
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async delete(resource, ...args) {
        return this.run(this.prepareCommand('delete', resource, ...args))
    }

    /**
     * Invoke `kind delete cluster` command
     * @param name cluster name
     * @returns {Promise<Array>} console output as an array of strings
     */
    async deleteCluster(name) {
        return this.delete('cluster', `-n ${name}`)
    }

    /**
     * Invoke `kind get` command
     * @param resource represents kind sub-command (e.g. cluster | nodes )
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async get(resource, ...args) {
        return this.run(this.prepareCommand('get', resource, ...args))
    }

    /**
     * Invoke `kind get clusters` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async getClusters(...args) {
        return this.get('clusters', ...args)
    }

    /**
     * Invoke `kind get nodes` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async getNodes(...args) {
        return this.get('nodes', ...args)
    }

    /**
     * Invoke `kind get kubeconfig` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async getKubeconfig(...args) {
        return this.get('kubeconfig', ...args)
    }

}