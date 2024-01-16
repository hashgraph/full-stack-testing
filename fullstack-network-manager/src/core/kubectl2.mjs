import * as k8s from '@kubernetes/client-node'
import net from 'net'
import path from 'path'
import { FullstackTestingError, MissingArgumentError } from './errors.mjs'
import * as sb from 'stream-buffers'
import * as helpers from './helpers.mjs'

/**
 * A kubectl wrapper class providing custom functionalities required by fsnetman
 *
 * This class isn't threadsafe
 */
export class Kubectl2 {
  constructor () {
    this._kubeConfig = new k8s.KubeConfig()
    this._kubeConfig.loadFromDefault()
  }

  /**
   * Get current context object
   */
  getCurrentContext () {
    const name = this._kubeConfig.getCurrentContext()
    return this._kubeConfig.getContextObject(name)
  }

  /**
   * Set current context
   * @param contextName context name
   */
  setCurrentContext (contextName) {
    if (!this._kubeConfig.getContextObject(contextName)) throw new FullstackTestingError(`context not found with name: ${name}`)

    // set current context
    this._kubeConfig.setCurrentContext(contextName)

    this.kubeClient = null // reset client
  }

  setCurrentNamespace (namespace) {
    this._namespace = namespace
  }

  getCurrentNamespace () {
    return this._namespace
  }

  _initChecks () {
    if (!this._kubeConfig.getCurrentContext()) throw new FullstackTestingError('context is not set')
    if (!this._namespace) throw new FullstackTestingError('namespace is not set')
  }

  _initKubeClient () {
    this._initChecks()
    if (!this._kubeClient) {
      this._kubeClient = this._kubeConfig.makeApiClient(k8s.CoreV1Api)
    }

    return this._kubeClient
  }

  _initKubeCopy () {
    this._initChecks()
    if (!this._kubeCopy) {
      this._kubeCopy = new k8s.Cp(this._kubeConfig)
    }

    return this._kubeCopy
  }

  /**
   * Apply filters to metadata
   * @param items list of items
   * @param filters an object with metadata fields and value
   * @return {*[]}
   */
  applyMetadataFilter (items, filters = {}) {
    if (!filters) throw new MissingArgumentError('filters are required')

    const matched = []
    const filterMap = new Map(Object.entries(filters))
    for (const item of items) {
      // match all filters
      let foundMatch = true
      for (const entry of filterMap.entries()) {
        const field = entry[0]
        const value = entry[1]

        if (item.metadata[field] !== value) {
          foundMatch = false
          break
        }
      }

      if (foundMatch) {
        matched.push(item)
      }
    }

    return matched
  }

  /**
   * Filter a single item using metadata filter
   * @param items list of items
   * @param filters an object with metadata fields and value
   * @return {*}
   */
  filterItem (items, filters = {}) {
    const filtered = this.applyMetadataFilter(items, filters)
    if (filtered.length > 1) throw new FullstackTestingError('multiple items found with filters', { filters })
    if (filtered.length !== 1) throw new FullstackTestingError('item not found with filters', { filters })
    return filtered[0]
  }

  /**
   * Create a new namespace
   * @param name name of the namespace
   * @return {Promise<boolean>}
   */
  async createNamespace (name) {
    const payload = {
      metadata: {
        name
      }
    }

    const resp = await this._initKubeClient().createNamespace(payload)
    return resp.response.statusCode === 201
  }

  /**
   * Delete a namespace
   * @param name name of the namespace
   * @return {Promise<boolean>}
   */
  async deleteNamespace (name) {
    const resp = await this._initKubeClient().deleteNamespace(name)
    return resp.response.statusCode === 200.0
  }

  /**
   * Get a list of namespaces
   * @return {Promise<[string]>} list of namespaces
   */
  async getNamespaces () {
    const resp = await this._initKubeClient().listNamespace()
    if (resp.body && resp.body.items) {
      const namespaces = []
      resp.body.items.forEach(item => {
        namespaces.push(item.metadata.name)
      })

      return namespaces
    }

    throw new FullstackTestingError('incorrect response received from kubernetes API. Unable to list namespaces')
  }

  /**
   * Get a podName by name
   * @param name podName name
   * @return {Promise<{}>} k8s.V1Pod object
   */
  async getPodByName (name) {
    const fieldSelector = `metadata.name=${name}`
    const resp = await this._initKubeClient().listNamespacedPod(
      this.getCurrentNamespace(),
      undefined,
      undefined,
      undefined,
      fieldSelector
    )

    return this.filterItem(resp.body.items, { name })
  }

  /**
   * Get host IP of a podName
   * @param podNameName name of the podName
   * @returns {Promise<string>} podName IP
   */
  async getPodIP (podNameName) {
    const podName = await this.getPodByName(podNameName)
    if (podName && podName.status && podName.status.hostIP) {
      return podName.status.hostIP
    }

    throw new FullstackTestingError(`unable to find host IP of podName: ${podNameName}`)
  }

  /**
   * Get a svc by name
   * @param name svc name
   * @return {Promise<{}>} k8s.V1Service object
   */
  async getSvcByName (name) {
    const fieldSelector = `metadata.name=${name}`
    const resp = await this._initKubeClient().listNamespacedService(
      this.getCurrentNamespace(),
      undefined,
      undefined,
      undefined,
      fieldSelector
    )

    return this.filterItem(resp.body.items, { name })
  }

  /**
   * Get cluster IP of a service
   * @param svcName name of the service
   * @returns {Promise<string>} cluster IP
   */
  async getClusterIP (svcName) {
    const svc = await this.getSvcByName(svcName)
    if (svc && svc.spec && svc.spec.clusterIP) {
      return svc.spec.clusterIP
    }

    throw new FullstackTestingError(`unable to find cluster IP for svc: ${svcName}`)
  }

  /**
   * Get a list of clusters
   * @return {Promise<[string]>} list of clusters
   */
  async getClusters () {
    const clusters = []
    for (const cluster of this._kubeConfig.getClusters()) {
      clusters.push(cluster.name)
    }

    return clusters
  }

  /**
   * Get a list of contexts
   * @return {Promise<[string]>} list of contexts
   */
  async getContexts () {
    const contexts = []
    for (const context of this._kubeConfig.getContexts()) {
      contexts.push(context.name)
    }

    return contexts
  }

  /**
   * List files and directories in a container
   *
   * It runs ls -la on the specified path and returns a list of object containing the entries.
   * For example:
   * [{
   *    directory: false,
   *    owner: hedera,
   *    group: hedera,
   *    size: 121,
   *    modifiedAt: Jan 15 13:50
   *    name: config.txt
   * }]
   *
   * @param podName pod name
   * @param containerName container name
   * @param destPath path inside the container
   * @param timeout timeout in ms
   * @return {Promise<{}>}
   */
  async listDir (podName, containerName, destPath, timeout = 5000) {
    try {
      const output = await this.getExecOutput(podName, containerName, ['ls', '-la', destPath])
      if (!output) return []

      // parse the output and return the entries
      const items = []
      const lines = output.split('\n')
      for (let line of lines) {
        line = line.replace(/\s+/g, '|')
        const parts = line.split('|')
        if (parts.length === 9) {
          const name = parts[parts.length - 1]
          if (name !== '.' && name !== '..') {
            const permission = parts[0]
            const item = {
              directory: permission[0] === 'd',
              owner: parts[2],
              group: parts[3],
              size: parts[4],
              modifiedAt: `${parts[5]} ${parts[6]} ${parts[7]}`,
              name
            }

            items.push(item)
          }
        }
      }

      return items
    } catch (e) {
      throw new FullstackTestingError(`error occurred during listDir operation for path: ${destPath}: ${e.message}`, e)
    }
  }

  /**
   * Check if a filepath exists in the container
   * @param podName pod name
   * @param containerName container name
   * @param destPath path inside the container
   * @return {Promise<boolean>}
   */
  async hasFile (podName, containerName, destPath) {
    const parentDir = path.dirname(destPath)
    const fileName = path.basename(destPath)
    const entries = await this.listDir(podName, containerName, parentDir)

    for (const item of entries) {
      if (item.name === fileName && !item.directory) {
        return true
      }
    }

    return false
  }

  /**
   * Check if a directory path exists in the container
   * @param podName pod name
   * @param containerName container name
   * @param destPath path inside the container
   * @return {Promise<boolean>}
   */
  async hasDir (podName, containerName, destPath) {
    const parentDir = path.dirname(destPath)
    const dirName = path.basename(destPath)
    const entries = await this.listDir(podName, containerName, parentDir)
    for (const item of entries) {
      if (item.name === dirName && item.directory) {
        return true
      }
    }

    return false
  }

  /**
   * Copy a file into a container
   *
   * It overwrites any existing file inside the container at the destination directory
   *
   * @param podName podName name
   * @param containerName container name
   * @param srcPath source file path in the local
   * @param destDir destination directory in the container
   * @returns {Promise<boolean>}
   */
  async copyTo (podName, containerName, srcPath, destDir) {
    try {
      const srcFile = path.basename(srcPath)
      const srcDir = path.dirname(srcPath)
      await this._initKubeCopy().cpToPod(this.getCurrentNamespace(), podName, containerName, srcFile, destDir, srcDir)
      return true
    } catch (e) {
      throw new FullstackTestingError(`failed to copy file to container [pod: ${podName} container:${containerName}]: ${srcPath} -> ${destDir}: ${e.message}`, e)
    }
  }

  /**
   * Copy a file from a container
   *
   * It overwrites any existing file at the destination directory
   *
   * @param podName podName name
   * @param containerName container name
   * @param srcPath source file path in the container
   * @param destDir destination directory in the local
   * @returns {Promise<boolean>}
   */
  async copyFrom (podName, containerName, srcPath, destDir) {
    try {
      const srcFile = path.basename(srcPath)
      const srcDir = path.dirname(srcPath)
      await this._initKubeCopy().cpFromPod(this.getCurrentNamespace(), podName, containerName, srcFile, destDir, srcDir)
      return true
    } catch (e) {
      throw new FullstackTestingError(`failed to copy file from container [pod: ${podName} container:${containerName}]: ${srcPath} -> ${destDir}: ${e.message}`, e)
    }
  }

  /**
   * Invoke bash command within a container and return the console output as string
   *
   * @param podName pod name
   * @param containerName container name
   * @param command bash commands as an array to be run within the containerName (e.g 'ls -la /opt/hgcapp')
   * @param timeoutMs timout in milliseconds
   * @returns {Promise<string>} console output as string
   */
  async getExecOutput (podName, containerName, command = [], timeoutMs = 1000) {
    try {
      if (!command) return ''
      if (timeoutMs < 0 || timeoutMs === 0) throw MissingArgumentError('timeout cannot be negative or zero')

      const execInstance = new k8s.Exec(this._kubeConfig)
      const outStream = new sb.WritableStreamBuffer()
      const errStream = new sb.WritableStreamBuffer()
      let execStatus = 'Failure'

      await execInstance.exec(
        this.getCurrentNamespace(),
        podName,
        containerName,
        command,
        outStream,
        errStream,
        null,
        false,
        ({ status }) => {
          execStatus = status
          if (status === 'Failure' || errStream.size()) {
            throw new FullstackTestingError(`Error - details: \n ${errStream.getContentsAsString()}`)
          }
        }
      )

      // we need to poll to get the output contents
      return new Promise((resolve, reject) => {
        let resolved = false

        const pollFunc = () => {
          if (execStatus === 'Success') {
            resolved = true
            resolve(outStream.getContentsAsString())
            return true
          }

          return false
        }

        const timeoutFunc = () => {
          if (!resolved) {
            reject(new FullstackTestingError(`timeout occurred during exec in '${podName}:${containerName}': ${command.join[' ']}`))
          }
        }

        helpers.poll(pollFunc, timeoutFunc, 100, timeoutMs)
      })
    } catch (e) {
      throw new FullstackTestingError(`error occurred during exec in '${podName}:${containerName}': ${command.join[' ']}`)
    }
  }

  /**
   * Port forward a port from a pod to localhost
   *
   * This simple server just forwards traffic from itself to a service running in kubernetes
   * -> localhost:localPort -> port-forward-tunnel -> kubernetes-pod:targetPort
   *
   * @param podName pod name
   * @param localPort local port
   * @param podPort port of the pod
   * @returns {Promise<net.Server>} return the instance of the server that caller must close
   */
  async portForward (podName, localPort, podPort) {
    const forwarder = new k8s.PortForward(this._kubeConfig, true)
    const server = net.createServer((socket) => {
      forwarder.portForward(this.getCurrentNamespace(), podName, [podPort], socket, null, socket)
    })

    return server.listen(localPort, '127.0.0.1')
  }

  /**
   * Invoke `kubectl wait` command
   * @param resource a kubernetes resource type (e.g. podName | svc etc.)
   * @param args args of the command
   * @returns {Promise<Array>} console output as an array of strings
   */
  // async waitForPod(namespace, phase = 'Running', labels = [], timeoutSeconds = 0.3) {
  //   // await this.kubectl.wait('podName',
  //   //   '--for=jsonpath=\'{.status.phase}\'=Running',
  //   //   '-l fullstack.hedera.com/type=network-node',
  //   //   `-l fullstack.hedera.com/node-name=${nodeId}`,
  //   //   `--timeout=${timeout}`,
  //   //   `-n "${namespace}"`
  //   // )
  //   const self = this
  //   const delay = 100
  //   let status = false
  //
  //   const fieldSelector = `status.phase=${phase}`
  //   const labelSelector = labels.join(',')
  //
  //   const podNames = await self.kubeClient.listPodForAllNamespaces(
  //     false,
  //     false,
  //     fieldSelector,
  //     labelSelector,
  //   )
  //
  //   const check = function () {
  //     console.log(new Date())
  //     const podNames = self.kubeClient.listPodForAllNamespaces(
  //       false,
  //       false,
  //       fieldSelector,
  //       labelSelector,
  //       )
  //     return false
  //   }
  //
  //   let timerId = setTimeout( () => {
  //     status = check()
  //     if (status) {
  //       clearTimeout(timerId)
  //     } else {
  //       timerId = setTimeout(check, delay)
  //     }
  //   }, timeout)
  //
  //   if (!status) {
  //     throw new FullstackTestingError(`timeout occurred during waiting for podName`)
  //   }
  //
  //   clearTimeout(timerId)
  //   return true
  // }
}
