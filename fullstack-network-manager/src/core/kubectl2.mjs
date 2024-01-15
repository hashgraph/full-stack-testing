import * as k8s from '@kubernetes/client-node'
import {FullstackTestingError, MissingArgumentError, ResourceNotFoundError} from "./errors.mjs";

/**
 * A kubectl wrapper class providing custom functionalities required by fsnetman
 */
export class Kubectl2 {
  constructor() {
    this._kubeConfig = new k8s.KubeConfig()
    this._kubeConfig.loadFromDefault()
  }

  /**
   * Get current context object
   */
  getCurrentContext() {
    const name = this._kubeConfig.getCurrentContext()
    return this._kubeConfig.getContextObject(name)
  }

  /**
   * Set current context
   * @param contextName context name
   */
  setCurrentContext(contextName) {
    if (!this._kubeConfig.getContextObject(contextName)) throw new FullstackTestingError(`context not found with name: ${name}`)

    // set current context
    this._kubeConfig.setCurrentContext(contextName)

    this.kubeClient = null // reset client
  }

  setCurrentNamespace(namespace) {
    this._namespace = namespace
  }

  getCurrentNamespace() {
    return this._namespace
  }

  _initChecks() {
    if (!this._kubeConfig.getCurrentContext()) throw new FullstackTestingError('context is not set')
    if (!this._namespace) throw new FullstackTestingError('namespace is not set')
  }

  _initKubeClient() {
    this._initChecks()
    if (!this._kubeClient) {
      this._kubeClient = this._kubeConfig.makeApiClient(k8s.CoreV1Api)
    }

    return this._kubeClient
  }

  _initKubeCopy() {
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
  applyMetadataFilter(items, filters = {}) {
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
  filterItem(items, filters = {}) {
    const filtered = this.applyMetadataFilter(items, filters)
    if (filtered.length > 1) throw new FullstackTestingError('multiple items found with filters', {filters})
    if (filtered.length !== 1) throw new FullstackTestingError('item not found with filters', {filters})
    return filtered[0]
  }

  /**
   * Create a new namespace
   * @param name name of the namespace
   * @return {Promise<boolean>}
   */
  async createNamespace(name) {
    const payload = {
      metadata: {
        name: name,
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
  async deleteNamespace(name) {
    const resp = await this._initKubeClient().deleteNamespace(name)
    return resp.response.statusCode === 200.
  }

  /**
   * Get a list of namespaces
   * @return {Promise<[string]>} list of namespaces
   */
  async getNamespaces() {
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
  async getPodByName(name) {
    const fieldSelector = `metadata.name=${name}`
    const resp = await this._initKubeClient().listNamespacedPod(
      this.getCurrentNamespace(),
      undefined,
      undefined,
      undefined,
      fieldSelector,
    )

    return this.filterItem(resp.body.items, {name})
  }

  /**
   * Get host IP of a podName
   * @param podNameName name of the podName
   * @returns {Promise<string>} podName IP
   */
  async getPodIP(podNameName) {
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
  async getSvcByName(name) {
    const fieldSelector = `metadata.name=${name}`
    const resp = await this._initKubeClient().listNamespacedService(
      this.getCurrentNamespace(),
      undefined,
      undefined,
      undefined,
      fieldSelector,
    )

    return this.filterItem(resp.body.items, {name})
  }

  /**
   * Get cluster IP of a service
   * @param svcName name of the service
   * @returns {Promise<string>} cluster IP
   */
  async getClusterIP(svcName) {
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
  async getClusters() {
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
  async getContexts() {
    const contexts = []
    for (const context of this._kubeConfig.getContexts()) {
      contexts.push(context.name)
    }

    return contexts
  }

  /**
   * Copy file into a containerName
   * @param podName podName name
   * @param containerName container name
   * @param srcPath
   * @param destPath
   * @param tmpDir temp directory to be used
   * @returns {Promise<boolean>}
   */
  async copy(podName, containerName, srcPath, destPath, tmpDir = undefined) {
    try {
      await this._initKubeCopy().cpToPod(this.getCurrentNamespace(), podName, containerName, srcPath, destPath, tmpDir)
    } catch (e) {
      throw new FullstackTestingError(`failed to copy file: ${podName} -c ${containerName} ${srcPath}:${destPath}: ${e.message}`, e)
    }

    return true
  }

  /**
   * Invoke `kubectl port-forward svc/<svc name>` command
   * @param resource name of the service or podName. Must be of the format podName/<podName name> or svc/<service name>
   * @param localPort port of the host machine
   * @param remotePort port to be forwarded from the service or podName
   * @returns {Promise<Array>} console output as an array of strings
   */
  async portForward(resource, localPort, remotePort) {
    // return this.run(this.prepareCommand(`port-forward ${resource} ${localPort}:${remotePort} &`))
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

  /**
   * Invoke bash command within a containerName
   * @param podName a kubernetes podName name
   * @param containerName name of the containerName within the podName
   * @param bashScript bash script to be run within the containerName (e.g 'ls -la /opt/hgcapp')
   * @returns {Promise<Array>} console output as an array of strings
   */
  async execContainer(podName, containerName, bashScript) {
  }


}
