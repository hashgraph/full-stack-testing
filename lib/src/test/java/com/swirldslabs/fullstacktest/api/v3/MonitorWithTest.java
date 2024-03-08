package com.swirldslabs.fullstacktest.api.v3;

import org.junit.jupiter.api.Test;
import org.junit.platform.testkit.engine.EngineExecutionResults;

import static com.swirldslabs.fullstacktest.api.JupiterEngineTest.jupiterExecute;

public class MonitorWithTest {
    static class Monitor1 implements Monitor { public void monitor(Runnable ready) {} }
    static class Monitor2 implements Monitor { public void monitor(Runnable ready) {} }
    static class Monitor3 implements Monitor { public void monitor(Runnable ready) {} }
    static class Monitor4 implements Monitor { public void monitor(Runnable ready) {} }
    static class Monitor5 implements Monitor { public void monitor(Runnable ready) {} }
    static class Monitor6 implements Monitor { public void monitor(Runnable ready) {} }
    static class Monitor7 implements Monitor { public void monitor(Runnable ready) {} }
    static class Monitor8 implements Monitor { public void monitor(Runnable ready) {} }


    @MonitorWith(Monitor1.class)
    @MonitorWith(Monitor2.class)
    interface TestIfc {}
    @MonitorWith(Monitor3.class)
    @MonitorWith(Monitor4.class)
    static class TestBase implements TestIfc {}
    @MonitorWith(Monitor5.class)
    @MonitorWith(Monitor6.class)
    static class TestClass extends TestBase {
        @Test
        @MonitorWith(Monitor7.class)
        @MonitorWith({Monitor1.class, Monitor8.class})
        void test() {}
    }

    @Test void test() {
        EngineExecutionResults results = jupiterExecute(TestClass.class);
        results.allEvents().debug();
    }
}
