import { DataValidationError, MissingArgumentError } from './errors.mjs'

export class Templates {
  static renderNetworkPodName(nodeId) {
    return `network-${nodeId}-0`
  }

  static renderNodeSvcName(nodeId) {
    return `network-${nodeId}-svc`
  }

  static renderNetworkSvcName(nodeId) {
    return `network-${nodeId}-svc`
  }

  static extractNodeIdFromPodName(podName) {
    const parts = podName.split('-')
    if (parts.length !== 3) throw new DataValidationError(`pod name is malformed : ${podName}`, 3, parts.length)
    return parts[1].trim()
  }

  static prepareReleasePrefix(tag) {
    if (!tag) throw new MissingArgumentError('tag cannot be empty')

    const parsed = tag.split('.')
    if (parsed.length < 3) throw new Error(`tag (${tag}) must include major, minor and patch fields (e.g. v0.40.4)`)
    return `${parsed[0]}.${parsed[1]}`
  }
}
