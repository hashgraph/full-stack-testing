package com.swirldslabs.fullstacktest.api.v4;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.platform.engine.discovery.ClassSelector;
import org.junit.platform.engine.discovery.DiscoverySelectors;
import org.junit.platform.testkit.engine.EngineExecutionResults;
import org.junit.platform.testkit.engine.EngineTestKit;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Phaser;
import java.util.stream.Stream;

import static java.time.Duration.ZERO;
import static java.time.temporal.ChronoUnit.FOREVER;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.params.provider.Arguments.arguments;

@Timeout(1)
public class RepeatableInvariantTest {
    static Duration sleepDuration;
    static void sleep() throws InterruptedException {
        Thread.sleep(sleepDuration);
    }
    static class SynchronizedInvariant implements Invariant {
        private Phaser phaser;
        public SynchronizedInvariant() {}

        public SynchronizedInvariant registerPhaser(Phaser phaser) {
            this.phaser = phaser;
            phaser.register();
            return this;
        }

        @Override
        public void monitorInvariant() throws AssertionError, InterruptedException {
            if (null != phaser) {
                phaser.arriveAndAwaitAdvance();
            } else {
                sleep();
            }
        }
    }

    static class SynchronizedInvariant0 extends SynchronizedInvariant {}
    static class SynchronizedInvariant1 extends SynchronizedInvariant {}
    static class SynchronizedInvariant2 extends SynchronizedInvariant {}
    static class SynchronizedInvariant3 extends SynchronizedInvariant {}
    static class SynchronizedInvariant4 extends SynchronizedInvariant {}
    static class SynchronizedInvariant5 extends SynchronizedInvariant {}
    static class SynchronizedInvariant6 extends SynchronizedInvariant {}
    static class SynchronizedInvariant7 extends SynchronizedInvariant {}
    static class SynchronizedInvariant8 extends SynchronizedInvariant {}
    static class SynchronizedInvariant9 extends SynchronizedInvariant {}

    @Constraint({SynchronizedInvariant0.class, SynchronizedInvariant1.class})
    @Constraint({SynchronizedInvariant2.class, SynchronizedInvariant3.class})
    interface TestIfc {}
    @Constraint(SynchronizedInvariant4.class)
    @Constraint(SynchronizedInvariant5.class)
    static class TestBase {}
    @Constraint({SynchronizedInvariant6.class, SynchronizedInvariant7.class})
    @TestInstance(TestInstance.Lifecycle.PER_METHOD)
    static class LifeCyclePerMethodTest extends TestBase implements TestIfc {
        void test(ConstraintContext ctx, Phaser phaser) throws Exception {
            for (Class<? extends SynchronizedInvariant> aClass : List.of(SynchronizedInvariant0.class,
                    SynchronizedInvariant1.class, SynchronizedInvariant2.class, SynchronizedInvariant3.class,
                    SynchronizedInvariant4.class, SynchronizedInvariant5.class, SynchronizedInvariant6.class,
                    SynchronizedInvariant7.class, SynchronizedInvariant8.class, SynchronizedInvariant9.class)) {
                SynchronizedInvariant invariant = ctx.stop(aClass);
                ctx.start(invariant);
                invariant = ctx.stop(invariant, aClass);
                invariant.registerPhaser(phaser);
                ctx.start(invariant);
            }
            assertEquals(11, phaser.getRegisteredParties());
            phaser.arriveAndDeregister();
        }
        @Test
        @Constraint({SynchronizedInvariant8.class, SynchronizedInvariant9.class})
        void test1(ConstraintContext ctx) throws Exception {
            test(ctx, new Phaser(1));
        }

        @Test
        @Constraint({SynchronizedInvariant8.class, SynchronizedInvariant9.class})
        void test2(ConstraintContext ctx) throws Exception {
            test(ctx, new Phaser(1));
        }
    }

    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    static class LifeCyclePerClassTest extends LifeCyclePerMethodTest {}
    static EngineExecutionResults jupiterExecute(boolean concurrentClasses, boolean concurrentMethods, Class<?>... classes) {
        return EngineTestKit
                .engine("junit-jupiter")
                .configurationParameter("junit.jupiter.execution.parallel.enabled", "true")
                .configurationParameter("junit.jupiter.execution.parallel.mode.default", concurrentMethods ? "concurrent" : "same_thread")
                .configurationParameter("junit.jupiter.execution.parallel.mode.classes.default", concurrentClasses ? "concurrent" : "same_thread")
                .selectors(Arrays.stream(classes).map(DiscoverySelectors::selectClass).toArray(ClassSelector[]::new))
                .execute();
    }
    static Stream<Arguments> generateArguments() {
        return Stream.of(ZERO, FOREVER.getDuration()).flatMap(sleepDuration ->
                Stream.of(false, true).flatMap(concurrentClasses ->
                        Stream.of(false, true).flatMap(concurrentMethods ->
                                Stream.of(arguments(sleepDuration, concurrentClasses, concurrentMethods)))));
    }
    @ParameterizedTest
    @MethodSource("generateArguments")
    void testLifeCyclePerMethod(Duration sleepDuration, boolean concurrentClasses, boolean concurrentMethods) {
        RepeatableInvariantTest.sleepDuration = sleepDuration;
        jupiterExecute(concurrentClasses, concurrentMethods, LifeCyclePerClassTest.class, LifeCyclePerMethodTest.class)
                .testEvents().assertStatistics(stats -> stats.started(4).succeeded(4).failed(0));
    }
}
