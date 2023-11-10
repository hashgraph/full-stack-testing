import {ShellRunner} from "./shell_runner.mjs";
import {FullstackTestingError} from "./errors.mjs";

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

    /**
     * Get pod IP of a pod
     * @param podName name of the pod
     * @returns {Promise<Array>} console output as an array of strings
     */
    async getPodIP(podName) {
        return new Promise(async (resolve, reject) => {
            try {
                const output = await this.run(this.prepareCommand('get', 'pod', podName, `-o jsonpath='{.status.podIP}'`))
                if (output) resolve(output[0].trim())
                reject(new FullstackTestingError(`No resource found for ${podName}`))
            } catch (e) {
                reject(new FullstackTestingError(`error on detecting IP for pod ${podName}`, e))
            }
        })
    }

    /**
     * Get cluster IP of a service
     * @param svcName name of the service
     * @returns {Promise<Array>} console output as an array of strings
     */
    async getClusterIP(svcName) {
        return new Promise(async (resolve, reject) => {
            try {
                const output = await this.run(this.prepareCommand('get', 'svc', svcName, `-o jsonpath='{.spec.clusterIP}'`))
                if (output) resolve(output[0].trim())
                reject(new FullstackTestingError(`No resource found for ${svcName}`))
            } catch (e) {
                reject(new FullstackTestingError(`error on detecting cluster IP for svc ${svcName}`, e))
            }
        })
    }


    /**
     * Invoke `kubectl wait` command
     * @param resource a kubernetes resource type (e.g. pod | svc etc.)
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async wait(resource, ...args) {
        return this.run(this.prepareCommand('wait', resource, ...args))
    }

    /**
     * Invoke `kubectl exec` command
     * @param pod a kubernetes pod name
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async exec(pod,  ...args) {
        return this.run(this.prepareCommand('exec', pod, ...args))
    }

    /**
     * Invoke bash command within a container
     * @param pod a kubernetes pod name
     * @param container name of the container within the pod
     * @param bashScript bash script to be run within the container (e.g 'ls -la /opt/hgcapp')
     * @returns {Promise<Array>} console output as an array of strings
     */
    async execContainer(pod, container, bashScript) {
       return this.exec(pod, `-c ${container} -- `, `bash -c "${bashScript}"`)
    }

    /**
     * Invoke `kubectl cp` command
     * @param pod a kubernetes pod name
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async copy(pod, ...args) {
        return this.run(this.prepareCommand('cp', ...args))
    }

    /**
     * Invoke `kubectl config` command
     * @param args args of the command
     * @returns {Promise<Array>} console output as an array of strings
     */
    async config(...args) {
        return this.run(this.prepareCommand('config', ...args))
    }
}