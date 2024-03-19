package com.swirldslabs.fullstacktest.api.v4;

import org.junit.platform.commons.logging.Logger;
import org.junit.platform.commons.logging.LoggerFactory;

import java.lang.invoke.MethodHandles;
import java.util.Collections;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.function.Consumer;
import java.util.function.Predicate;

/**
 * Need to test this
 * */
public class SimpleMessageQueue {
    private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
    public interface Message {}

    public static class Subscription<T extends Message> implements AutoCloseable {
        private final Class<? extends Message> aClass;
        public final BlockingQueue<T> queue = new LinkedBlockingQueue<>();
        final Predicate<T> filter;
        private final Consumer<Subscription<T>> unsubscribe;
        Subscription(Class<? extends Message> aClass, Predicate<T> filter, Consumer<Subscription<T>> unsubscribe) {
            this.aClass = aClass;
            this.filter = filter;
            this.unsubscribe = unsubscribe;
        }
        @Override
        public void close() {
            unsubscribe.accept(this);
        }
        @SuppressWarnings("unchecked")
        private void accept(Message message) throws InterruptedException {
            if (aClass.isAssignableFrom(message.getClass())) {
                T msg = (T) message;
                if (filter.test(msg)) {
//                    System.out.println(".");
                    logger.info(() -> "putting msg in queue: " + msg + ", from inside thread=" + Thread.currentThread());
//                    try {
//                        Thread.sleep(1);
                        queue.put(msg);
//                    } catch (InterruptedException exception) {
//                        queue.put(msg);
//                        Thread.currentThread().interrupt(); // this is terrible
//                    }
                    logger.info(() -> "msg in queue: " + msg);
                }
            }
        }
    }

    private final Set<Subscription<? extends Message>> subscriptions = Collections.newSetFromMap(new ConcurrentHashMap<>());

    public <T extends Message> Subscription<T> subscribe(Class<T> aClass) {
        return subscribe(aClass, msg -> true);
    }
    public <T extends Message> Subscription<T> subscribe(Class<T> aClass, Predicate<T> filter) {
        Subscription<T> subscription = new Subscription<>(aClass, filter, this::unsubscribe);
        subscriptions.add(subscription);
        return subscription;
    }

    public <T extends Message> void unsubscribe(Subscription<T> subscription) {
        subscriptions.remove(subscription);
    }

    public void publish(Message message) {
        logger.info(() -> "publish: " + message);
//        System.out.println("publish: " + message + ", Q:" + this);
        Objects.requireNonNull(message);
        Thread.ofVirtual().start(() -> { // run in another thread which is *unlikely* to be interrupted. fixme!
            try {
                for (Subscription<? extends Message> subscription : subscriptions) {
                    subscription.accept(message);
                }
            } catch (InterruptedException exception) {
//                System.out.println("publish interrupted!");
                logger.info(() -> "publish interrupted!");
                Thread.currentThread().interrupt();
            }
        });
    }
}
