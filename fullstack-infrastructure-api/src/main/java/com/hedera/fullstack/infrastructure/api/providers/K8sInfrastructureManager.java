package com.hedera.fullstack.infrastructure.api.providers;

import com.hedera.fullstack.helm.client.HelmClient;
import io.fabric8.kubernetes.client.KubernetesClient;

public class K8sInfrastructureManager implements InfrastructureManager {
    HelmClient helmClient;
    KubernetesClient k8sClient;

}
