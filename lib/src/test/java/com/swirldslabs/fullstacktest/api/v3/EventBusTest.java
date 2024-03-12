package com.swirldslabs.fullstacktest.api.v3;

import com.swirldslabs.fullstacktest.api.v4.SimpleMessageQueue;
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
        try (SimpleMessageQueue.Subscription<SimpleMessageQueue.Message> all = eventBus.subscribe(SimpleMessageQueue.Message.class)) {
            assertEquals(0, all.queue.size());
            eventBus.publish(new StartEvent());
            assertEquals(1, all.queue.size());
        }
        try (SimpleMessageQueue.Subscription<StartEvent> start = eventBus.subscribe(StartEvent.class)) {
            assertEquals(0, start.queue.size());
            eventBus.publish(new StopEvent());
            assertEquals(0, start.queue.size());
            eventBus.publish(new StartEvent());
            assertEquals(1, start.queue.size());
        }
    }
}
