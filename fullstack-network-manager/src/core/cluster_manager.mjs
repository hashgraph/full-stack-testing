import { MissingArgumentError } from './errors.mjs'
import * as core from './index.mjs'

export class ClusterManager {
  constructor (kind) {
    if (!kind) throw new MissingArgumentError('An instance of core/Kind is required')
    this.kind = kind
  }

  async getClusters () {
    return this.kind.getClusters('-q')
  }

  async createCluster (clusterName) {
    return this.kind.createCluster(clusterName, `--config ${core.constants.RESOURCES_DIR}/dev-cluster.yaml`)
  }

  async deleteCluster (clusterName) {
    return this.kind.deleteCluster(clusterName)
  }

  async getClusterInfo (clusterName) {
    return this.kind.get(`kubeconfig -n ${clusterName}`)
  }
}
