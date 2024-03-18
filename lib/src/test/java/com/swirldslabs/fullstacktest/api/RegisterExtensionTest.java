package com.swirldslabs.fullstacktest.api;

import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.extension.ExtensionContext.Store.CloseableResource;
import org.junit.jupiter.api.extension.support.TypeBasedParameterResolver;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.platform.commons.util.ReflectionUtils;

import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static org.junit.jupiter.api.DynamicTest.dynamicTest;
import static org.junit.jupiter.api.extension.ExtensionContext.Namespace.create;

public class RegisterExtensionTest {
    static class WrappedException extends RuntimeException {
        public WrappedException(Throwable cause) {
            super(cause);
        }
    }
    interface MyContextIfc extends CloseableResource {}
    static class MyContextImpl implements MyContextIfc {
        @Override
        public void close() throws Throwable {

        }
    }
    static class MyExtension extends TypeBasedParameterResolver<MyContextIfc> implements AfterTestExecutionCallback, BeforeTestExecutionCallback, InvocationInterceptor {
        private static final ScopedValue<MyContextIfc> myContext = ScopedValue.newInstance();
        static class CloseableSet implements CloseableResource {
            Set<MyContextIfc> set = Collections.newSetFromMap(new ConcurrentHashMap<>());
            @Override
            public void close() throws Throwable {
                for (MyContextIfc ctx : set) {
                    ctx.close();
                }
            }
        }
        Set<MyContextIfc> cleanup(ExtensionContext ctx) {
            return ctx.getStore(create(ctx.getRequiredTestClass(), ctx.getRequiredTestMethod()))
                    .getOrComputeIfAbsent(CloseableSet.class, ReflectionUtils::newInstance, CloseableSet.class).set;
        }
        interface Invoker<V> {
            V invoke() throws Throwable;
        }
        static int cnt = 0;
        <T> T invoke(ExtensionContext extensionContext, Invoker<T> invoker) throws Throwable {
            MyContextIfc context = new MyContextImpl();
            try {
                return ScopedValue.callWhere(myContext, context, () -> {
                    try {
                        System.out.println("calling context ctx = " + context);
                        T result = invoker.invoke();
                        context.close();
                        return result;
                    } catch (Throwable throwable) {
                        throw new WrappedException(throwable);
                    }
                });
            } catch (WrappedException exception) {
                cleanup(extensionContext).add(context);
                throw exception.getCause();
            }
        }
        @Override
        public void afterTestExecution(ExtensionContext extensionContext) throws Exception {}
        @Override
        public void beforeTestExecution(ExtensionContext extensionContext) throws Exception {}

        @Override
        public void interceptDynamicTest(Invocation<Void> invocation, DynamicTestInvocationContext invocationContext, ExtensionContext extensionContext) throws Throwable {
            invoke(extensionContext.getParent().get(), invocation::proceed);
        }

        @Override
        public <T> T interceptTestFactoryMethod(Invocation<T> invocation, ReflectiveInvocationContext<Method> invocationContext, ExtensionContext extensionContext) throws Throwable {
            return invoke(extensionContext, invocation::proceed);
        }

        @Override
        public MyContextIfc resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
            return (MyContextIfc) Proxy.newProxyInstance(MyContextIfc.class.getClassLoader(),
                    new Class<?>[] { MyContextIfc.class },
                    (proxy, method, args) -> method.invoke(myContext.get(), args));
        }
    }

    @ExtendWith(MyExtension.class)
    static class MyTest {
        @TestFactory
        @Execution(ExecutionMode.CONCURRENT)
        Stream<DynamicTest> testFactory(MyContextIfc ctx) {
            System.out.println("inside test factory: " + ctx);
            return IntStream.range(0, 10).mapToObj(n -> dynamicTest("test#" + n, () -> { System.out.println("inside dynamic test: " + ctx);}));
        }
/*
        @ParameterizedTest
        @ValueSource(ints = {1,2,3})
        void parameterizedTest(int i, MyContext ctx) {}
        @RepeatedTest(3)
        void repeatedTest(MyContext ctx) {}
        @Test
        void test(MyContext ctx) {}
*/
    }
}
