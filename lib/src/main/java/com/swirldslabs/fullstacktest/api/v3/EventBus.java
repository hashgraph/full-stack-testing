package com.swirldslabs.fullstacktest.api.v3;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.function.Consumer;
import java.util.function.Predicate;

public class EventBus {
    interface Message {}

    static class Subscription implements AutoCloseable {
        public final BlockingQueue<Message> queue = new LinkedBlockingQueue<>();
        final Predicate<Message> filter;
        private final Consumer<Subscription> cancel;
        Subscription(Predicate<Message> filter, Consumer<Subscription> cancel) {
            this.filter = filter;
            this.cancel = cancel;
        }
        @Override
        public void close() throws Exception {
            cancel.accept(this);
        }
    }

    private final Set<Subscription> subscriptions = Collections.newSetFromMap(new ConcurrentHashMap<>());

    Subscription subscribe(Predicate<Message> filter) {
        Subscription subscription = new Subscription(filter, this::unsubscribe);
        subscriptions.add(subscription);
        return subscription;
    }

    void unsubscribe(Subscription subscription) {
        subscriptions.remove(subscription);
    }

    void publish(Message message) throws InterruptedException {
        for (Subscription sub : subscriptions) {
            if (sub.filter.test(message)) {
                sub.queue.put(message);
            }
        }
    }

    int subscribers() {
        return subscriptions.size();
    }
}
