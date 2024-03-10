package com.swirldslabs.fullstacktest.api.v4;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.platform.testkit.engine.EngineExecutionResults;
import org.opentest4j.IncompleteExecutionException;

import java.time.Duration;
import java.util.Optional;
import java.util.Random;

import static com.swirldslabs.fullstacktest.api.JupiterEngineTest.jupiterExecute;

public class PreConditionProbeTest {
    interface MyPreConditionProbe extends PreConditionProbe {

        @Override
        public default Duration retryDelay(Random random, long attempt, Optional<Duration> previous) {
            return Duration.ZERO;
        }
    }

    static class Probe1 implements MyPreConditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe2 implements MyPreConditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe3 implements MyPreConditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe4 implements MyPreConditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe5 implements MyPreConditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            for (long loop = Long.MIN_VALUE; loop < Long.MAX_VALUE; ++loop);
            return true;
        }
    }
    static class Probe6 implements MyPreConditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return true;
        }
    }
    static class Probe7 implements MyPreConditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return false;
        }
    }
    static class Probe8 implements MyPreConditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            for (long loop = Long.MIN_VALUE; loop < Long.MAX_VALUE; ++loop);
            return true;
        }
    }

    static class MyInvariant implements Invariant {
        @Override
        public void monitor() throws AssertionError, IncompleteExecutionException, InterruptedException {
            Thread.sleep(15);
        }
    }

    @Constraint({Probe1.class, Probe2.class})
    @ExtendWith(ConstraintExtension.class)
    interface TestIfc {}
    @Constraints({@Constraint({Probe3.class, Probe4.class}), @Constraint({Probe5.class})})
    static class BaseTest implements TestIfc {}
    @Constraint(Probe6.class)
    @Constraint(Probe7.class)
    static class MyTest extends BaseTest {
        @Test
        @Constraint(Probe8.class)
        @Constraint(MyInvariant.class)
        void test() {}
    }

    @Test
    void test() {
        EngineExecutionResults results = jupiterExecute(MyTest.class);
        results.allEvents().debug();
    }

    static class X implements InvariantProbe, PreConditionProbe {
        @Override
        public boolean probe() throws AssertionError, IncompleteExecutionException, InterruptedException {
            return false;
        }
    }
}
