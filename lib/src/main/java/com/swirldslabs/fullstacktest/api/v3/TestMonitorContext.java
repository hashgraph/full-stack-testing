package com.swirldslabs.fullstacktest.api.v3;

import com.swirldslabs.fullstacktest.api.v4.SimpleMessageQueue;
import com.swirldslabs.fullstacktest.api.v4.SimpleMessageQueue.Message;
import com.swirldslabs.fullstacktest.api.v4.SimpleMessageQueue.Subscription;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.platform.commons.util.ReflectionUtils;

import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.ThreadFactory;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.platform.commons.support.AnnotationSupport.findRepeatableAnnotations;

public class TestMonitorContext {
    SimpleMessageQueue messageQueue = new SimpleMessageQueue();
    ThreadFactory threadFactory;

    sealed interface InitialMessage extends Message {}
    record UncaughtException(Thread thread, Throwable exception) implements InitialMessage {}
    record Ready(Thread thread) implements InitialMessage {}
    class ReportReady implements Runnable {
        boolean reported = false;
        @Override
        public void run() {
            if (!reported) {
                messageQueue.publish(new Ready(Thread.currentThread()));
                reported = true;
            }
        }
    }
    Subscription<InitialMessage> subscription;
    interface Key {}
    record ClassKey(Class<? extends Monitor> aClass) implements Key {}
    record InstanceKey(Monitor monitor) implements Key {}
    record Value(Thread thread, Monitor monitor) {}
    Map<Key, Value> running = new HashMap<>();
    TestMonitorContext(ExtensionContext extensionContext) throws Throwable {
        Class<?> testClass = extensionContext.getRequiredTestClass();
        Method testMethod = extensionContext.getRequiredTestMethod();
        threadFactory = Thread.ofVirtual()
                .name(testClass.getName() + "#" + testMethod.getName(), 0)
                .uncaughtExceptionHandler((t, e) -> messageQueue.publish(new UncaughtException(t, e)))
                .factory();
        List<Class<? extends Monitor>> monitors = Stream.concat(
                        findRepeatableAnnotations(testClass, MonitorWith.class).stream(),
                        findRepeatableAnnotations(testMethod, MonitorWith.class).stream())
                .flatMap(monitorWith -> Arrays.stream(monitorWith.value()))
                .distinct()
                .toList();
        for (Class<? extends Monitor> monitor : monitors) {
            Monitor instance = ReflectionUtils.newInstance(monitor);
            running.put(new InstanceKey(instance), new Value(threadFactory.newThread(() -> instance.monitor(new ReportReady())), instance));
        }
        Set<Thread> set = running.values().stream().map(v -> v.thread).collect(Collectors.toCollection(HashSet::new));
        subscription = messageQueue.subscribe(InitialMessage.class);
        while (!set.isEmpty()) {
            switch (subscription.queue.take()) {
                case Ready(Thread thread) -> set.remove(thread);
                case UncaughtException(Thread thread, Throwable exception) -> throw exception;
            }
        }
    }
}
