export class AccountManager {
  constructor (logger, k8) {
    if (!logger) throw new Error('An instance of core/Logger is required')
    if (!k8) throw new Error('An instance of core/K8 is required')

    this.logger = logger
    this.k8 = k8
  }

  async prepareAccount () {

  }

  async jeromyTesting (argv) {
    const { namespace, nodeIds } = argv
    const labelSelector =
    const serviceList = await this.k8.kubeClient.listNamespacedService(
        namespace, undefined, undefined, undefined, undefined, labelSelector)
    // const clusterInfo = this.kubeClient.getCurrentCluster()
    const componentStatus = await this.k8.kubeClient.listComponentStatus()
    return {
      serviceList,
      // "clusterInfo": clusterInfo,
      componentStatus,
      kubeClient: this.k8.kubeClient,
      basePath: this.k8.kubeClient.basePath
    }
  }
}
