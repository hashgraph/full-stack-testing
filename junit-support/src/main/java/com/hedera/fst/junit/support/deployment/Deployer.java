package com.hedera.fst.junit.support.deployment;

import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodList;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.fabric8.kubernetes.client.Watch;
import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import java.util.ArrayList;
import java.util.List;

public class Deployer {
    int runningCount = 0;

    public void deployFromResource(String resourceName, String namespace) throws InterruptedException {
        try (KubernetesClient client = new KubernetesClientBuilder().build()) {
            client.load(Deployer.class.getResourceAsStream(resourceName))
                    .inNamespace(namespace)
                    .createOrReplace();

            PodList podList = client.pods().inNamespace(namespace).list();
            List<Watch> watchList = new ArrayList<>();
            for (Pod pod : podList.getItems()) {
                watchList.add(client.pods().inNamespace(namespace).withName(pod.getMetadata().getName()).watch(new Watcher<>() {
                    @Override
                    public void eventReceived(Action action, Pod resource) {
                        System.out.println("Event received: " + action.name() + " " + resource.getMetadata().getName());
                        if (resource.getStatus().getPhase().equals("Running")){
                            runningCount++;
                        }
                    }

                    @Override
                    public void onClose(WatcherException cause) {
                        System.out.println("Watcher close due to " + cause);
                    }
                }));
            }
            while (runningCount < podList.getItems().size()) {
                Thread.sleep(1000);
            }
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
