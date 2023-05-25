package com.hedera.fst.junit.support.deployment;

import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodList;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.fabric8.kubernetes.client.Watch;
import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class Deployer {
    int runningCount = 0;


    public void deployFromResource(String resourceName, String namespace) throws InterruptedException {
        try (KubernetesClient client = new KubernetesClientBuilder().build()) {
            client.load(Deployer.class.getResourceAsStream(resourceName))
                    .inNamespace(namespace)
                    .createOrReplace();

            Thread.sleep(3000);
            PodList podList = client.pods().inNamespace(namespace).list();
            for (Pod pod : podList.getItems()) {
                client.pods().inNamespace(namespace).withName(pod.getMetadata().getName())
                        .watch(new Watcher<>() {
                            @Override
                            public void eventReceived(Action action, Pod resource) {
                                System.out.println(LocalDateTime.now() +
                                        " Event received: " + action.name() + " " + resource.getMetadata().getName());
                                if (resource.getStatus().getPhase().equals("Running")) {
                                    runningCount++;
                                }
                            }

                            @Override
                            public void onClose(WatcherException cause) {
                                System.out.println("Watcher close due to " + cause);
                            }
                        });
            }
            while (runningCount < podList.getItems().size()) {
                Thread.sleep(1000);
            }
        }
    }

    public void deleteFromResource(String resourceName, String namespace) throws InterruptedException {
        try (KubernetesClient client = new KubernetesClientBuilder().build()) {
            PodList podList = client.pods().inNamespace(namespace).list();
            runningCount = podList.getItems().size();
            client.load(Deployer.class.getResourceAsStream(resourceName))
                    .inNamespace(namespace)
                    .delete();
            for (Pod pod : podList.getItems()) {
                client.pods().inNamespace(namespace).withName(pod.getMetadata().getName())
                        .watch(new Watcher<>() {
                            @Override
                            public void eventReceived(Action action, Pod resource) {
                                System.out.println(LocalDateTime.now() +
                                        " Event received: " + action.name() + " " + resource.getMetadata().getName()
                                        + " "
                                        + resource.getStatus().getPhase());
                                if (action.name().equals("DELETED")) {
                                    runningCount--;
//                                    PodList podList = client.pods().inNamespace(namespace).list();
//                                    System.out.println(
//                                            LocalDateTime.now() + " Pods remaining: " + podList.getItems().size());
//                                    try {
//                                        Thread.sleep(1000);
//                                    } catch (InterruptedException e) {
//                                        throw new RuntimeException(e);
//                                    }
//                                    podList = client.pods().inNamespace(namespace).list();
//                                    System.out.println(
//                                            LocalDateTime.now() + " Pods remaining: " + podList.getItems().size());
//                                }
                                }
                            }

                            @Override
                            public void onClose(WatcherException cause) {
                                System.out.println("Watcher close due to " + cause);
                            }
                        });
            }
            while (runningCount > 0) {
                Thread.sleep(1000);
            }
        }
    }
}
