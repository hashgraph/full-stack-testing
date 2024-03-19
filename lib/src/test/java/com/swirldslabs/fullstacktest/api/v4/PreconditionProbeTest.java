package com.swirldslabs.fullstacktest.api.v4;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;
import org.junit.platform.commons.logging.Logger;
import org.junit.platform.commons.logging.LoggerFactory;
import org.junit.platform.launcher.Launcher;
import org.junit.platform.launcher.LauncherSession;
import org.junit.platform.launcher.TestIdentifier;
import org.junit.platform.launcher.core.LauncherFactory;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;
import org.junit.platform.testkit.engine.EngineExecutionResults;
import org.opentest4j.IncompleteExecutionException;

import java.lang.invoke.MethodHandles;
import java.time.Duration;
import java.util.Optional;

import static com.swirldslabs.fullstacktest.api.JupiterEngineTest.jupiterExecute;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

public class PreconditionProbeTest {
    interface MyPreconditionProbe extends PreconditionProbe {
        @Override
        default Duration preConditionRetryDelayOnFailure() {
            return Duration.ZERO;
        }
    }

    static class Probe1 implements MyPreconditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe2 implements MyPreconditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe3 implements MyPreconditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe4 implements MyPreconditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe5 implements MyPreconditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            //for (long loop = Long.MIN_VALUE; loop < Long.MAX_VALUE; ++loop);
            return true;
        }
    }
    static class Probe6 implements MyPreconditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe7 implements MyPreconditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe8 implements MyPreconditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            //for (long loop = Long.MIN_VALUE; loop < Long.MAX_VALUE; ++loop);
            return true;
        }
    }

    static class MyInvariant implements Invariant {
        @Override
        public void monitorInvariant() throws AssertionError, IncompleteExecutionException, InterruptedException {
            Thread.sleep(1000);
//            for (long loop = Long.MIN_VALUE; loop < Long.MAX_VALUE; ++loop);
//            assumeTrue(false);
//            assertTrue(false);
        }
    }

    static class MyInvariant1 extends MyInvariant {
        @Override
        public void monitorInvariant() throws AssertionError, IncompleteExecutionException, InterruptedException {
            System.out.println("MyInvariant1 start: " + Thread.currentThread());
            try {
                Thread.sleep(1000);
            } finally {
                System.out.println("MyInvariant1 done");
            }
//            for (long loop = Long.MIN_VALUE; loop < Long.MAX_VALUE; ++loop);
        }
    }
    static class MyInvariant2 extends MyInvariant {}
    static class MyInvariant3 extends MyInvariant {}
    static class MyInvariant4 extends MyInvariant {}
    static class MyInvariant5 extends MyInvariant {}

    static class MyWatcher implements TestWatcher {
        private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
        @Override
        public void testDisabled(ExtensionContext context, Optional<String> reason) {
            TestWatcher.super.testDisabled(context, reason);
        }

        @Override
        public void testSuccessful(ExtensionContext context) {
            TestWatcher.super.testSuccessful(context);
        }

        @Override
        public void testAborted(ExtensionContext context, Throwable cause) {
//            logger.info(() -> cause.getLocalizedMessage());
//            context.publishReportEntry(cause.getLocalizedMessage());
//            TestWatcher.super.testAborted(context, cause);
        }

        @Override
        public void testFailed(ExtensionContext context, Throwable cause) {
            TestWatcher.super.testFailed(context, cause);
        }
    }

    @Constraint({Probe1.class, Probe2.class, MyInvariant1.class})
    @ExtendWith(ConstraintExtension.class)
    @ExtendWith(MyWatcher.class)
    interface TestIfc {}
    @Constraints({@Constraint({Probe3.class, Probe4.class}), @Constraint({Probe5.class, MyInvariant2.class})})
    static class BaseTest implements TestIfc {}
    @Constraint(Probe6.class)
    @Constraint(Probe7.class)
    @Constraint(MyInvariant3.class)
//    @Disabled
    static class MyTest extends BaseTest {
        @BeforeAll
        static void before() {}
        @Test
        @Constraint(Probe8.class)
        @Constraint(MyInvariant4.class)
        void test(ConstraintContext ctx) throws Exception {
            Thread.sleep(100);
            MyInvariant1 myInvariant1 = ctx.stop(MyInvariant1.class);
            ctx.start(myInvariant1);
            ctx.stop(myInvariant1, MyInvariant1.class);
        }
    }

    @Test
    void test() {
        EngineExecutionResults results = jupiterExecute(MyTest.class);
        results.allEvents().debug();
    }

    static class X implements InvariantProbe, PreconditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return false;
        }
    }
}
