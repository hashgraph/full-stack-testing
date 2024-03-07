package com.swirldslabs.fullstacktest.api;

import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestReporter;
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.extension.support.TypeBasedParameterResolver;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.platform.testkit.engine.EngineExecutionResults;
import org.junit.platform.testkit.engine.EngineTestKit;

import java.lang.reflect.Method;
import java.util.UUID;

import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;

public class TemplateTest {
    @Test
    void test() {
        EngineExecutionResults results = jupiterExecute(TempTest.class);
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

    static class Interceptor extends TypeBasedParameterResolver<UUID> implements InvocationInterceptor {
        @Override
        public void interceptTestMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
            extensionContext.publishReportEntry("instance: " + extensionContext.getTestInstance().toString());
            extensionContext.publishReportEntry("interceptTestMethod: " + extensionContext.getUniqueId());
            InvocationInterceptor.super.interceptTestMethod(invocation, invocationContext, extensionContext);
        }

        @Override
        public void interceptTestTemplateMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
            extensionContext.publishReportEntry("instance: " + extensionContext.getTestInstance().toString());
            InvocationInterceptor.super.interceptTestTemplateMethod(invocation, invocationContext, extensionContext);
        }

        @Override
        public UUID resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
            extensionContext.publishReportEntry("resolveParameter: " + extensionContext.getUniqueId());
            return UUID.randomUUID();
        }
    }

    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    @Execution(ExecutionMode.CONCURRENT)
    @ExtendWith(Interceptor.class)
    static class TempTest {
        @Execution(ExecutionMode.CONCURRENT)
        @RepeatedTest(2)
        void repeat(TestReporter reporter, UUID uuid) {
            reporter.publishEntry("thread: " + Thread.currentThread());
            reporter.publishEntry("uuid: " + uuid);
        }

        @Execution(ExecutionMode.CONCURRENT)
        @ParameterizedTest
        @ValueSource(strings = {"a", "b"})
        void param(String s, TestReporter reporter, UUID uuid) {
            reporter.publishEntry("thread: " + Thread.currentThread());
            reporter.publishEntry("uuid: " + uuid);
        }

        @Test
        @Execution(ExecutionMode.CONCURRENT)
        void test1(TestReporter reporter, UUID uuid) {
            reporter.publishEntry("thread: " + Thread.currentThread());
            reporter.publishEntry("uuid: " + uuid);
        }
        @Test
        @Execution(ExecutionMode.CONCURRENT)
        void test2(TestReporter reporter, UUID uuid) {
            reporter.publishEntry("thread: " + Thread.currentThread());
            reporter.publishEntry("uuid: " + uuid);
        }
    }
}
