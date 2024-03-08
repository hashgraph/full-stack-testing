package com.swirldslabs.fullstacktest.api.v3;

import java.util.Collections;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.function.Consumer;
import java.util.function.Predicate;

public class SimpleMessageQueue {
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
                    queue.put(msg);
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
        Objects.requireNonNull(message);
        try {
            for (Subscription<? extends Message> subscription : subscriptions) {
                subscription.accept(message);
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }
}
