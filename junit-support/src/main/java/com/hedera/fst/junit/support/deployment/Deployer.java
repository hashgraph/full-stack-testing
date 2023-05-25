package com.hedera.fst.junit.support.deployment;

import io.fabric8.kubernetes.api.model.HasMetadata;
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodList;
import io.fabric8.kubernetes.api.model.PodStatus;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.fabric8.kubernetes.client.dsl.ParameterNamespaceListVisitFromServerGetDeleteRecreateWaitApplicable;
import java.util.List;

public class Deployer {
    public void deployFromResource(String resourceName, String namespace) throws InterruptedException {
        try (KubernetesClient client = new KubernetesClientBuilder().build()) {
            client.load(Deployer.class.getResourceAsStream(resourceName))
                    .inNamespace(namespace)
                    .createOrReplace();

            PodList podList = client.pods().inNamespace(namespace).list();
            for (Pod pod : podList.getItems()) {
                while(!pod.getStatus().getPhase().equals("Running")) {
                    Thread.sleep(1000);
                    pod = client.pods().inNamespace(namespace).withName(pod.getMetadata().getName()).get();
                }
            }

//            //WATCH
//            Watch watch = client.pods().inNamespace(namespace).withName("pod1").watch(new Watcher<Pod>() {
//                @Override
//                public void eventReceived(Action action, Pod resource) {
//                    switch (action) {
//                        case DELETED:
//                            deleteLatch.countDown();
//                            break;
//                        default:
//                            throw new AssertionFailedError(action.toString().concat(" isn't recognised."));
//                    }
//                }
//
//                @Override
//                public void onClose(KubernetesClientException cause) {
//                    closeLatch.countDown();
//                }
//            });
        }
    }

    public void deleteFromResource(String resourceName, String namespace) {
        try (KubernetesClient client = new KubernetesClientBuilder().build()) {
            client.load(Deployer.class.getResourceAsStream(resourceName))
                    .inNamespace(namespace)
                    .delete();
        }
    }
}
