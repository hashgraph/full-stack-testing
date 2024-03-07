package com.swirldslabs.fullstacktest.api.v3;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.function.Consumer;
import java.util.function.Predicate;

public class SimpleMessageQueue {
    public interface Message {}

    public static class Subscription implements AutoCloseable {
        public final BlockingQueue<Message> queue = new LinkedBlockingQueue<>();
        final Predicate<Message> filter;
        private final Consumer<Subscription> unsubscribe;
        Subscription(Predicate<Message> filter, Consumer<Subscription> unsubscribe) {
            this.filter = filter;
            this.unsubscribe = unsubscribe;
        }
        @Override
        public void close() throws Exception {
            unsubscribe.accept(this);
        }
    }

    private final Set<Subscription> subscriptions = Collections.newSetFromMap(new ConcurrentHashMap<>());

    public Subscription subscribe(Predicate<Message> filter) {
        Subscription subscription = new Subscription(filter, this::unsubscribe);
        subscriptions.add(subscription);
        return subscription;
    }

    public void unsubscribe(Subscription subscription) {
        subscriptions.remove(subscription);
    }

    public void publish(Message message) throws InterruptedException {
        for (Subscription sub : subscriptions) {
            if (sub.filter.test(message)) {
                sub.queue.put(message);
            }
        }
    }

    public int subscribers() {
        return subscriptions.size();
    }
}
