import {DataValidationError} from "./errors.mjs";

export class Templates {
    static renderNetworkPodName(nodeId) {
        return `network-${nodeId}-0`
    }

    static renderNetworkSvcName(nodeId) {
        return `network-${nodeId}-svc`
    }

    static extractNodeIdFromPodName(podName) {
        const parts = podName.split('-')
        if (parts.length !== 3) throw new DataValidationError(`pod name is malformed : ${podName}`, 3, parts.length)
        return parts[1].trim()
    }
}
