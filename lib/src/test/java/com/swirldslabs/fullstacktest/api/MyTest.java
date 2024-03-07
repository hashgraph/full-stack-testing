package com.swirldslabs.fullstacktest.api;

import org.apiguardian.api.API;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.extension.support.TypeBasedParameterResolver;
import org.junit.platform.commons.util.ReflectionUtils;
import org.junit.platform.testkit.engine.EngineExecutionResults;
import org.junit.platform.testkit.engine.EngineTestKit;

import java.lang.annotation.*;
import java.lang.reflect.Method;

import static org.apiguardian.api.API.Status.STABLE;
import static org.junit.jupiter.api.Assertions.assertEquals;
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

//    @AfterEach
//    void afterEach() {
//        assertEquals(1, 2);
//    }

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
//            try {
//                Thread.sleep(500);
//            } catch (InterruptedException e) {
//                extensionContext.publishReportEntry("got interrupted!");
//                throw new RuntimeException(e);
//            }
            //invocation.proceed();
            // ReflectionUtils.invokeMethod(this.method, this.target.orElse((Object)null), this.arguments);
            ReflectionUtils.invokeMethod(invocationContext.getExecutable(), invocationContext.getTarget().orElse(null), invocationContext.getArguments().toArray());
        }

        @Override
        public void interceptTestTemplateMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
            extensionContext.publishReportEntry("interceptTestTemplateMethod");
            invocation.proceed();
        }

        @Override
        public void interceptAfterEachMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
            invocation.proceed();
        }

        @Override
        public MyClient resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
//            try {
//                extensionContext.getExecutableInvoker().invoke(MonitorTest.class.getMethod("foo", MyClient.class), extensionContext.getRequiredTestInstance());
//            } catch (NoSuchMethodException e) {
//                throw new RuntimeException(e);
//            }
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

        @AfterEach
        void afterEach(TestReporter reporter, MyClient client) {}

//        public void foo(MyClient client) {
//            System.out.println("foo called!");
//        }
    }
}
