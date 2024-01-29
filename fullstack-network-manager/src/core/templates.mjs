import * as x509 from '@peculiar/x509'
import { DataValidationError, MissingArgumentError } from './errors.mjs'

export class Templates {
  static renderNetworkPodName (nodeId) {
    return `network-${nodeId}-0`
  }

  static renderNodeSvcName (nodeId) {
    return `network-${nodeId}-svc`
  }

  static renderNetworkSvcName (nodeId) {
    return `network-${nodeId}-svc`
  }

  /**
   * Generate pfx node private key file name
   * @param nodeId node ID
   * @returns {string}
   */
  static renderGossipPfxPrivateKeyFile (nodeId) {
    return `private-${nodeId}.pfx`
  }

  static renderGossipPemPrivateKeyFile (prefix, nodeId) {
    // s-node0-key.pem
    return `${prefix}-private-${nodeId}.pem`
  }

  static renderGossipPemPublicKeyFile (prefix, nodeId) {
    // s-node0-cert.pem
    return `${prefix}-public-${nodeId}.pem`
  }

  static renderTLSPemPrivateKeyFile (nodeId) {
    return `hedera-${nodeId}.key`
  }

  static renderTLSPemPublicKeyFile (nodeId) {
    // s-node0-cert.pem
    return `hedera-${nodeId}.crt`
  }

  static renderNodeFriendlyName (prefix, nodeId, suffix = '') {
    const parts = [prefix, nodeId]
    if (suffix) parts.push(suffix)
    return parts.join('-')
  }

  static extractNodeIdFromPodName (podName) {
    const parts = podName.split('-')
    if (parts.length !== 3) throw new DataValidationError(`pod name is malformed : ${podName}`, 3, parts.length)
    return parts[1].trim()
  }

  static prepareReleasePrefix (tag) {
    if (!tag) throw new MissingArgumentError('tag cannot be empty')

    const parsed = tag.split('.')
    if (parsed.length < 3) throw new Error(`tag (${tag}) must include major, minor and patch fields (e.g. v0.40.4)`)
    return `${parsed[0]}.${parsed[1]}`
  }

  static renderDistinguishedName (nodeId,
    state = 'TX',
    locality = 'Richardson',
    org = 'Hedera',
    orgUnit = 'Hedera',
    country = 'US'
  ) {
    return new x509.Name(`CN=${nodeId},ST=${state},L=${locality},O=${org},OU=${orgUnit},C=${country}`)
  }
}
