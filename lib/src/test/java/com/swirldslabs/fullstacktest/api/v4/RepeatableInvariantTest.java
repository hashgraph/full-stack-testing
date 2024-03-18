package com.swirldslabs.fullstacktest.api.v4;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.platform.commons.logging.Logger;
import org.junit.platform.commons.logging.LoggerFactory;
import org.junit.platform.engine.discovery.ClassSelector;
import org.junit.platform.engine.discovery.DiscoverySelectors;
import org.junit.platform.testkit.engine.EngineExecutionResults;
import org.junit.platform.testkit.engine.EngineTestKit;

import java.lang.invoke.MethodHandles;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Phaser;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static java.time.Duration.ZERO;
import static java.time.temporal.ChronoUnit.FOREVER;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.DynamicTest.dynamicTest;
import static org.junit.jupiter.params.provider.Arguments.arguments;

@Disabled
@Timeout(10)
public class RepeatableInvariantTest {
    private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
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
            try {
//                logger.info(() -> "monitor enter(" + (null != phaser) + "): " + getClass());
//            System.out.println("monitor enter: " + getClass());
                if (null != phaser) {
                    phaser.arriveAndAwaitAdvance();
                } else {
                    sleep();
                }
//                logger.info(() -> "monitor exit: " + getClass());
//            System.out.println("monitor exit: " + getClass());
            } catch (InterruptedException uncaughtHandlerMayNotRunForThese) {
//                logger.info(() -> "monitor eating interrupt!");
            } catch (Throwable throwable) {
//                logger.info(() -> "monitor exception: " + throwable + ", " + getClass());
                throw throwable;
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
            System.out.println("context: " + ctx + ", msgQ: " + ctx.msgQueue);
            assertEquals(11, phaser.getRegisteredParties());
            phaser.arriveAndDeregister();
        }
        @Disabled
        @Test
//        @RepeatedTest(1000)
//        @Timeout(2)
        @Constraint({SynchronizedInvariant8.class, SynchronizedInvariant9.class})
        void test1(ConstraintContext ctx) throws Exception {
//            RepeatableInvariantTest.sleepDuration = ZERO; //FOREVER.getDuration();
            test(ctx, new Phaser(1));
        }

//        @BeforeEach
//        void beforeEach() {
////            RepeatableInvariantTest.sleepDuration = ZERO; //FOREVER.getDuration();
//            sleepDuration = ZERO;
//        }
        @Disabled
//        @Execution(ExecutionMode.CONCURRENT)
        @RepeatedTest(50)
        @Constraint({SynchronizedInvariant8.class, SynchronizedInvariant9.class})
        void test2(ConstraintContext ctx) throws Exception {
            test(ctx, new Phaser(1));
        }

        @Disabled
        @TestFactory
        @Constraint({SynchronizedInvariant8.class, SynchronizedInvariant9.class})
        Stream<DynamicTest> test3(ConstraintContext ctx) throws Exception {
            test(ctx, new Phaser(1));
//            sleepDuration = FOREVER.getDuration();
            return IntStream.range(0, 5)
                    .mapToObj(n -> dynamicTest("dynamic test:" + n, () -> {
                        System.out.println("test3: " + Thread.currentThread());
//                        test(ctx, new Phaser(1));
                    }));
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
//    static Duration initialSleepDuration = null;
    @ParameterizedTest
    @MethodSource("generateArguments")
    void testLifeCyclePerMethod(Duration sleepDuration, boolean concurrentClasses, boolean concurrentMethods) {
//        concurrentClasses = false;
//        concurrentMethods = false;
        RepeatableInvariantTest.sleepDuration = sleepDuration;
        jupiterExecute(concurrentClasses, concurrentMethods, LifeCyclePerClassTest.class, LifeCyclePerMethodTest.class)
//        results.allEvents().debug();
                .testEvents().assertStatistics(stats -> stats.started(102).succeeded(102).failed(0));
    }
}
