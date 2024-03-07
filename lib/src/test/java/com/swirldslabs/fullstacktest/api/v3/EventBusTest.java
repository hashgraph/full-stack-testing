package com.swirldslabs.fullstacktest.api.v3;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class EventBusTest {
    sealed interface Event extends SimpleMessageQueue.Message {}
    record StartEvent() implements Event {}
    record StopEvent() implements Event {}
    @Test
    void test() throws Exception {
        SimpleMessageQueue eventBus = new SimpleMessageQueue();
        eventBus.publish(new StartEvent());
        assertEquals(0, eventBus.subscribers());
        try (SimpleMessageQueue.Subscription all = eventBus.subscribe(m -> m != null)) {
            assertEquals(0, all.queue.size());
            eventBus.publish(new StartEvent());
            assertEquals(1, all.queue.size());
            assertEquals(1, eventBus.subscribers());
        }
        assertEquals(0, eventBus.subscribers());
        try (SimpleMessageQueue.Subscription start = eventBus.subscribe(m -> m instanceof StartEvent)) {
            assertEquals(0, start.queue.size());
            eventBus.publish(new StopEvent());
            assertEquals(0, start.queue.size());
            eventBus.publish(new StartEvent());
            assertEquals(1, start.queue.size());
            assertEquals(1, eventBus.subscribers());
        }
        assertEquals(0, eventBus.subscribers());
    }
}
