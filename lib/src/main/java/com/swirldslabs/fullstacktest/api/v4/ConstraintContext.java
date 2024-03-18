package com.swirldslabs.fullstacktest.api.v4;

import com.swirldslabs.fullstacktest.api.v4.ConstraintExtensionState.*;
import com.swirldslabs.fullstacktest.api.v4.ConstraintExtensionState.Error;
import com.swirldslabs.fullstacktest.api.v4.SimpleMessageQueue.Subscription;
import org.junit.platform.commons.logging.Logger;
import org.junit.platform.commons.logging.LoggerFactory;

import java.lang.invoke.MethodHandles;

/**
 * Will be provided as an optional test case parameter.
 * */
public class ConstraintContext {
    private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
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
                try {
//                    logger.info(() -> "stop: waiting to rx next msg");
                    for (; null == subscription.queue.peek(); Thread.sleep(1)) ;
//                    logger.info(() -> "stop: next msg rx: " + subscription.queue.peek());
                } catch (Throwable throwable)  {
//                    logger.info(() -> "caught throwable waiting to rx stop: " + throwable + " inside: " + Thread.currentThread());
                    throw throwable;
                }
                switch (subscription.queue.take()) {
                    case Started(Invariant invariant) -> {}
                    case Stopped(Object object, Invariant invariant) -> {
                        if (objectToStop.equals(object)) {
                            return aClass.cast(invariant);
                        } else {
//                            logger.info(() -> "Stopped: not equal: " + objectToStop + ", " + object);
                        }
                    }
                    case Error(Object object, String message) -> {
                        if (objectToStop.equals(object)) {
                            throw new RuntimeException(message);
                        } else {
//                            logger.info(() -> "Error: not equal: " + objectToStop + ", " + object);
                        }
                    }
                }
            }
        }
    }
}
