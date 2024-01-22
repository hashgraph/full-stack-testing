import * as k8s from '@kubernetes/client-node'
import fs from 'fs'
import net from 'net'
import path from 'path'
import { flags } from '../commands/index.mjs'
import { FullstackTestingError, MissingArgumentError } from './errors.mjs'
import * as sb from 'stream-buffers'
import { sleep } from './helpers.mjs'

/**
 * A kubectl wrapper class providing custom functionalities required by fsnetman
 */
export class Kubectl2 {
  constructor (configManager, logger) {
    if (!configManager) throw new MissingArgumentError('An instance of core/ConfigManager is required')
    if (!logger) throw new MissingArgumentError('An instance of core/Logger is required')

    this.configManager = configManager
    this.logger = logger

    this.init()
  }

  getKubeConfig () {
    return this.kubeConfig
  }

  init () {
    this.kubeConfig = new k8s.KubeConfig()
    this.kubeConfig.loadFromDefault()

    if (!this.kubeConfig.getCurrentCluster()) {
      throw new FullstackTestingError('No active kubernetes cluster found. ' +
        'Please create a cluster and set current context.')
    }

    if (!this.kubeConfig.getCurrentContext()) {
      throw new FullstackTestingError('No active kubernetes context found. ' +
        'Please set current kubernetes context.')
    }

    this.kubeClient = this.kubeConfig.makeApiClient(k8s.CoreV1Api)
    this.kubeCopy = new k8s.Cp(this.kubeConfig)
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

    const resp = await this.kubeClient.createNamespace(payload)
    return resp.response.statusCode === 201
  }

  /**
   * Delete a namespace
   * @param name name of the namespace
   * @return {Promise<boolean>}
   */
  async deleteNamespace (name) {
    const resp = await this.kubeClient.deleteNamespace(name)
    return resp.response.statusCode === 200.0
  }

  /**
   * Get a list of namespaces
   * @return {Promise<[string]>} list of namespaces
   */
  async getNamespaces () {
    const resp = await this.kubeClient.listNamespace()
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
    const ns = this._getNamespace()
    const fieldSelector = `metadata.name=${name}`
    const resp = await this.kubeClient.listNamespacedPod(
      ns,
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
    const pod = await this.getPodByName(podNameName)
    if (pod && pod.status && pod.status.podIP) {
      this.logger.debug(`Found pod IP for ${podNameName}: ${pod.status.podIP}`)
      return pod.status.podIP
    }

    this.logger.debug(`Unable to find pod IP for ${podNameName}`)
    throw new FullstackTestingError(`unable to find host IP of podName: ${podNameName}`)
  }

  /**
   * Get a svc by name
   * @param name svc name
   * @return {Promise<{}>} k8s.V1Service object
   */
  async getSvcByName (name) {
    const ns = this._getNamespace()
    const fieldSelector = `metadata.name=${name}`
    const resp = await this.kubeClient.listNamespacedService(
      ns,
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
    for (const cluster of this.kubeConfig.getClusters()) {
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
    for (const context of this.kubeConfig.getContexts()) {
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
      const output = await this.execContainer(podName, containerName, ['ls', '-la', destPath])
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
   * @param filters an object with metadata fields and value
   * @return {Promise<boolean>}
   */
  async hasFile (podName, containerName, destPath, filters = {}) {
    const parentDir = path.dirname(destPath)
    const fileName = path.basename(destPath)
    const filterMap = new Map(Object.entries(filters))
    const entries = await this.listDir(podName, containerName, parentDir)

    for (const item of entries) {
      if (item.name === fileName && !item.directory) {
        let found = true

        for (const entry of filterMap.entries()) {
          const field = entry[0]
          const value = entry[1]
          if (`${value}` !== `${item[field]}`) {
            this.logger.debug(`File check failed ${podName}:${containerName} ${destPath}; ${field} expected ${value}, found ${item[field]}`, { filters })
            found = false
            break
          }
        }

        if (found) {
          this.logger.debug(`File check succeeded ${podName}:${containerName} ${destPath}`, { filters })
          return true
        }
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
   * @param maxAttempts max attempts to check if file is copied successfully or not
   * @param delay delay between attempts to check if file is copied successfully or not
   * @returns {Promise<>}
   */
  async copyTo (podName, containerName, srcPath, destDir, maxAttempts = 100, delay = 250) {
    const ns = this._getNamespace()

    try {
      const srcFile = path.basename(srcPath)
      const srcDir = path.dirname(srcPath)
      const destPath = `${destDir}/${srcFile}`

      await this.kubeCopy.cpToPod(ns, podName, containerName, srcFile, destDir, srcDir)

      // check if the file is copied successfully or not
      const fileStat = fs.statSync(srcPath)
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (await this.hasFile(podName, containerName, destPath, { size: fileStat.size })) {
          return true
        }
        await sleep(delay)
      }

      this.logger.debug(`File check failed after copy ${podName}:${containerName} [${srcPath} -> ${destDir}]`)
      throw new FullstackTestingError(`failed to find file after invoking copy: ${destPath}`)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy file to ${podName}:${containerName} [${srcPath} -> ${destDir}]: ${e.message}`, e)
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
   * @param maxAttempts max attempts to check if file is copied successfully or not
   * @param delay delay between attempts to check if file is copied successfully or not
   * @returns {Promise<boolean>}
   */
  async copyFrom (podName, containerName, srcPath, destDir, maxAttempts = 100, delay = 250) {
    const ns = this._getNamespace()

    try {
      const srcFile = path.basename(srcPath)
      const srcDir = path.dirname(srcPath)
      const destPath = `${destDir}/${srcFile}`
      if (!fs.existsSync(destDir)) throw new Error(`invalid destination dir: ${destDir}`)

      await this.kubeCopy.cpFromPod(ns, podName, containerName, srcFile, destDir, srcDir)

      // check if the file is copied successfully or not
      const entries = await this.listDir(podName, containerName, srcPath)
      if (entries.length !== 1) throw new FullstackTestingError(`exepected 1 entry, found ${entries.length}`, { entries })
      const srcFileDesc = entries[0]

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (fs.existsSync(destPath)) {
          const stat = fs.statSync(destPath)
          if (stat && `${stat.size}` === `${srcFileDesc.size}`) {
            return true
          }
        }
        await sleep(delay)
      }

      throw new FullstackTestingError(`failed to find file after invoking copy: ${destPath}`)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy file from ${podName}:${containerName} [${srcPath} -> ${destDir}]: ${e.message}`, e)
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
  async execContainer (podName, containerName, command, timeoutMs = 1000) {
    const ns = this._getNamespace()
    if (timeoutMs < 0 || timeoutMs === 0) throw new MissingArgumentError('timeout cannot be negative or zero')
    if (!command) throw new MissingArgumentError('command cannot be empty')
    if (!Array.isArray(command)) {
      command = command.split(' ')
    }

    const self = this
    return new Promise((resolve, reject) => {
      const execInstance = new k8s.Exec(this.kubeConfig)
      const outStream = new sb.WritableStreamBuffer()
      const errStream = new sb.WritableStreamBuffer()

      self.logger.debug(`Running exec ${podName} -c ${containerName} -- ${command.join(' ')}`)
      execInstance.exec(
        ns,
        podName,
        containerName,
        command,
        outStream,
        errStream,
        null,
        false,
        ({ status }) => {
          if (status === 'Failure' || errStream.size()) {
            reject(new FullstackTestingError(`Exec error:
              [exec ${podName} -c ${containerName} -- ${command.join(' ')}'] - error details:
              ${errStream.getContentsAsString()}`))
            return
          }

          const output = outStream.getContentsAsString()
          self.logger.debug(`Finished exec ${podName} -c ${containerName} -- ${command.join(' ')}`, { output })

          resolve(output)
        }
      )
    })
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
   */
  async portForward (podName, localPort, podPort) {
    const ns = this._getNamespace()
    const forwarder = new k8s.PortForward(this.kubeConfig, true)
    const server = net.createServer((socket) => {
      forwarder.portForward(ns, podName, [podPort], socket, null, socket)
    })

    return server.listen(localPort, '127.0.0.1')
  }

  /**
   * Wait for pod
   * @param status phase of the pod
   * @param labels pod labels
   * @param podCount number of pod expected
   * @param timeout timeout in milliseconds
   * @param delay delay between checks in milliseconds
   * @return {Promise<boolean>}
   */
  async waitForPod (status = 'Running', labels = [], podCount = 1, timeout = 1000, delay = 200) {
    const ns = this._getNamespace()
    const fieldSelector = `status.phase=${status}`
    const labelSelector = labels.join(',')

    timeout = Number.parseInt(`${timeout}`)
    if (timeout <= 0 || timeout < delay) {
      throw new FullstackTestingError(`invalid timeout '${timeout}' and delay '${delay}'`)
    }

    const maxAttempts = Math.round(timeout / delay)
    this.logger.debug(`WaitForPod [${fieldSelector}, ${labelSelector}], maxAttempts: ${maxAttempts}`)

    // wait for the pod to be available with the given status and labels
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      this.logger.debug(`Checking for pod ${fieldSelector}, ${labelSelector} [attempt: ${attempts}/${maxAttempts}]`)
      const resp = await this.kubeClient.listNamespacedPod(
        ns,
        false,
        false,
        undefined,
        fieldSelector,
        labelSelector
      )

      if (resp.body && resp.body.items && resp.body.items.length === podCount) {
        this.logger.debug(`Found ${resp.body.items.length}/${podCount} pod with ${fieldSelector}, ${labelSelector} [attempt: ${attempts}/${maxAttempts}]`)
        return true
      }

      await sleep(delay)
    }

    throw new FullstackTestingError(`Expected number of pod (${podCount}) not found ${fieldSelector} ${labelSelector} [maxAttempts = ${maxAttempts}]`)
  }

  _getNamespace () {
    const ns = this.configManager.getFlag(flags.namespace)
    if (!ns) throw new MissingArgumentError('namespace is not set')
    return ns
  }
}
