package com.swirldslabs.fullstacktest.api.v4;

import com.swirldslabs.fullstacktest.api.v4.ConstraintExtensionState.*;
import com.swirldslabs.fullstacktest.api.v4.ConstraintExtensionState.Error;
import com.swirldslabs.fullstacktest.api.v4.SimpleMessageQueue.Subscription;

/**
 * Will be provided as an optional test case parameter.
 * */
public class ConstraintContext {
    private SimpleMessageQueue msgQueue;

    public ConstraintContext(SimpleMessageQueue msgQueue) {
        this.msgQueue = msgQueue;
    }

    public <T extends Invariant> void start(T objectToStart) throws InterruptedException {
        try (Subscription<Response> subscription = msgQueue.subscribe(Response.class)) {
            msgQueue.publish(new StartRequest(objectToStart));
            while (true) {
                switch (subscription.queue.take()) {
                    case Started(Invariant invariant) -> {
                        if (objectToStart.equals(invariant)) {
                            return;
                        }
                    }
                    case Stopped(Object object, Invariant invariant) -> {}
                    case Error(Object object, String message) -> {
                        // this should not happen for start request, maybe rename error to stop-error
                        if (objectToStart.equals(object)) {
                            throw new RuntimeException(message);
                        }
                    }
                }
            }
        }
    }
    public <T extends Invariant> T stop(Class<T> classToStop) throws InterruptedException {
        return stop(classToStop, classToStop);
    }
    // T stop (T objectToStop) would also work here, except it conflict with stop above.
    public <T extends Invariant> T stop(Object objectToStop, Class<T> aClass) throws InterruptedException {
        try (Subscription<Response> subscription = msgQueue.subscribe(Response.class)) {
            msgQueue.publish(new StopRequest(objectToStop));
            while (true) {
                switch (subscription.queue.take()) {
                    case Started(Invariant invariant) -> {}
                    case Stopped(Object object, Invariant invariant) -> {
                        if (objectToStop.equals(object)) {
                            return aClass.cast(invariant);
                        }
                    }
                    case Error(Object object, String message) -> {
                        if (objectToStop.equals(object)) {
                            throw new RuntimeException(message);
                        }
                    }
                }
            }
        }
    }
}
