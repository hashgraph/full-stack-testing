import { FullstackTestingError, MissingArgumentError } from './errors.mjs'
import * as core from './index.mjs'
import YAML from 'yaml'

export class ClusterManager {
  constructor (kind, kubectl) {
    if (!kind) throw new MissingArgumentError('An instance of core/Kind is required')
    if (!kubectl) throw new MissingArgumentError('An instance of core/Kubectl is required')

    this.kind = kind
    this.kubectl = kubectl
  }

  parseKindClusterName (clusterName) {
    return clusterName.replaceAll('kind-', '')
  }

  async getKubeConfig () {
    const configYaml = await this.kubectl.config('view')
    return YAML.parse(configYaml.join('\n'))
  }

  async getClusters () {
    const kubeConfig = await this.getKubeConfig()
    const clusterNames = []
    if (kubeConfig.clusters) {
      kubeConfig.clusters.forEach(item => {
        clusterNames.push(item.name)
      })
    }

    return clusterNames
  }

  async createCluster (clusterName) {
    return this.kind.createCluster(clusterName, `--config ${core.constants.RESOURCES_DIR}/dev-cluster.yaml`)
  }

  async deleteCluster (clusterName) {
    return this.kind.deleteCluster(this.parseKindClusterName(clusterName))
  }

  async getClusterInfo (clusterName) {
    return this.kind.get(`kubeconfig -n ${this.parseKindClusterName(clusterName)}`)
  }

  async setContext (clusterName, namespace) {
    const kubeconfig = await this.getKubeConfig()
    for (const item of kubeconfig.contexts) {
      const context = item.context
      if (context.cluster === clusterName) {
        await this.kubectl.config(`use-context ${item.name}`)
        await this.kubectl.config(`set-context --current --namespace ${namespace}`)
        return true
      }
    }

    throw new FullstackTestingError(`not context found for cluster: ${clusterName}`)
  }
}
