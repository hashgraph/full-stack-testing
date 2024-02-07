/**
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the ""License"");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an ""AS IS"" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
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
    const labelSelector = ''
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
