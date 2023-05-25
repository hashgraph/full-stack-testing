package com.hedera.fst.junit.support.deployment;

import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodList;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import io.fabric8.kubernetes.client.dsl.ExecListener;
import io.fabric8.kubernetes.client.dsl.ExecWatch;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.time.LocalDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class Deployer {
    int runningCount = 0;
    private static final CountDownLatch execLatch = new CountDownLatch(1);


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

    public void executeCopy(String namespace, String sourceFilePath, String targetFilePath)
            throws InterruptedException {
        File fileToUpload = new File(sourceFilePath);
        try (KubernetesClient client = new KubernetesClientBuilder().build()) {
            PodList podList = client.pods().inNamespace(namespace).list();
            for (Pod pod : podList.getItems()) {
                String podName = pod.getMetadata().getName();
                client.pods().inNamespace(namespace)
                        .withName(podName)
                        .file(targetFilePath)
                        .upload(fileToUpload.toPath());

                ByteArrayOutputStream out = new ByteArrayOutputStream();
                ByteArrayOutputStream error = new ByteArrayOutputStream();

                ExecWatch execWatch = client.pods().inNamespace(namespace).withName(podName)
                        .writingOutput(out)
                        .writingError(error)
                        .usingListener(new MyPodExecListener())
//                        .exec("cat", targetFilePath);
                        .exec("touch", "/opt/hgcapp/targetFilePath.txt");

                boolean latchTerminationStatus = execLatch.await(30, TimeUnit.SECONDS);
                if (!latchTerminationStatus) {
                    System.out.println("Latch could not terminate within specified time");
                }
                System.out.println("Exec Output: {} " + out);
                execWatch.close();
            }
        }
    }
    private static class MyPodExecListener implements ExecListener {
        @Override
        public void onOpen() {
            System.out.println("Shell was opened");
        }

        @Override
        public void onFailure(Throwable t, Response failureResponse) {
            System.out.println("Some error encountered: " + t.getMessage() + ", " + failureResponse);
        }

        @Override
        public void onClose(int i, String s) {
            System.out.println("Shell Closing");
        }
    }
}
