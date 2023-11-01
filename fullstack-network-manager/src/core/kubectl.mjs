import {ShellRunner} from "./shell_runner.mjs";

export class Kubectl extends ShellRunner {
    /**
     * Prepare a `kubectl` shell command string
     * @param action represents a helm command (e.g. create | install | get )
     * @param args args of the command
     * @returns {string}
     */
    prepareCommand(action, ...args) {
        let cmd = `kubectl ${action} `
        args.forEach(arg => {cmd += ` ${arg}`})
        return cmd
    }

    /**
     * Invoke `kubectl create` command
     * @param resource a kubernetes resource type (e.g. pod | svc etc.)
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async create(resource, ...args) {
        return this.run(this.prepareCommand('create', resource, ...args))
    }

    /**
     * Invoke `kubectl create ns` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async createNamespace(...args) {
        return this.run(this.prepareCommand('create', 'ns', ...args))
    }

    /**
     * Invoke `kubectl delete` command
     * @param resource a kubernetes resource type (e.g. pod | svc etc.)
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async delete(resource, ...args) {
        return this.run(this.prepareCommand('delete', resource, ...args))
    }

    /**
     * Invoke `kubectl delete ns` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async deleteNamespace(...args) {
        return this.run(this.prepareCommand('delete', 'ns', ...args))
    }

    /**
     * Invoke `kubectl get` command
     * @param resource a kubernetes resource type (e.g. pod | svc etc.)
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async get(resource, ...args) {
        return this.run(this.prepareCommand('get', resource, ...args))
    }

    /**
     * Invoke `kubectl get ns` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async getNamespace(...args) {
        return this.run(this.prepareCommand('get', 'ns', ...args))
    }
}