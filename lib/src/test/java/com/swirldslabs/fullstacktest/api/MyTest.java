package com.swirldslabs.fullstacktest.api;

import org.apiguardian.api.API;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.extension.support.TypeBasedParameterResolver;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.platform.testkit.engine.EngineExecutionResults;
import org.junit.platform.testkit.engine.EngineTestKit;

import java.lang.annotation.*;
import java.lang.reflect.Method;

import static com.swirldslabs.fullstacktest.api.JupiterEngineTest.jupiterExecute;
import static org.apiguardian.api.API.Status.STABLE;
import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;

/*
* inside test case create extension and simulate monitors
*
* use virtual threads, need ability to fail test early, interrupt threads and close client
* */
public class MyTest {
    @Test
    void test() {
        EngineExecutionResults results = jupiterExecute(MonitorTest.class);
        results.allEvents().debug();
    }

    static EngineExecutionResults jupiterExecute(Class<?> aClass) {
        return EngineTestKit
                .engine("junit-jupiter")
                .configurationParameter("junit.jupiter.execution.parallel.enabled", "true")
                .configurationParameter("junit.jupiter.execution.parallel.mode.default", "concurrent")
                .selectors(selectClass(aClass))
                .execute();
    }

    class MyMonitor implements Monitor {

    }
    static class MyClient {
    }

    static class MyResource implements ExtensionContext.Store.CloseableResource {
        @Override
        public void close() {
        }
    }
    static class MonitorExtension extends TypeBasedParameterResolver<MyClient> implements InvocationInterceptor {
        @Override
        public void interceptTestMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
            extensionContext.publishReportEntry("interceptTestMethod");
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                extensionContext.publishReportEntry("got interrupted!");
                throw new RuntimeException(e);
            }
            invocation.proceed();
        }

        @Override
        public void interceptTestTemplateMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
            extensionContext.publishReportEntry("interceptTestTemplateMethod");
            invocation.proceed();
        }

        @Override
        public MyClient resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
            extensionContext.publishReportEntry("resolveParameter" + extensionContext);
            extensionContext.getStore(ExtensionContext.Namespace.create("myResource")).getOrComputeIfAbsent(MyResource.class);
            return new MyClient();
        }
    }

    @Target({ ElementType.TYPE, ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER })
    @Retention(RetentionPolicy.RUNTIME)
    @ExtendWith({ MonitorExtension.class })
    @Inherited
    @Documented
    @API(status = STABLE, since = "1.0")
    public @interface MonitorWith {
        Class<? extends Monitor>[] value() default {};
    }

//    @Execution(ExecutionMode.CONCURRENT)
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    @MonitorWith(MyMonitor.class)
    static class MonitorTest {
        @Test
        @Timeout(1)
//        @Execution(ExecutionMode.CONCURRENT)
        void test1(TestReporter reporter, MyClient client) {
            reporter.publishEntry("inside test1");
        }
        @Test
        @Timeout(1)
//        @Execution(ExecutionMode.CONCURRENT)
        void test2(TestReporter reporter, MyClient client) {
            reporter.publishEntry("inside test2");
        }
    }
}
